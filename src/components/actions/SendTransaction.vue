<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  useConnection,
  useChainId,
  useBalance,
  useClient,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "@wagmi/vue";
import { type Address, encodeFunctionData, formatUnits, parseEther, parseUnits } from "viem";
import { estimateGas, estimateFeesPerGas } from "viem/actions";
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from "reka-ui";
import { ChevronDown, ScanLine } from "lucide-vue-next";
import BaseInput from "../ui/BaseInput.vue";
import BaseButton from "../ui/BaseButton.vue";
import StatusBadge from "../ui/StatusBadge.vue";
import TokenLogo from "../ui/TokenLogo.vue";
import QrScanner from "./QrScanner.vue";
import { validateAddress, validateAmount, isUserRejection } from "../../utils/validation";
import { formatBalance } from "../../utils/format";
import { getExplorerTxUrl } from "../../utils/chains";
import { useToast } from "../../composables/useToast";
import { calculateMaxSendable, resolveTransactionChainId } from "../../utils/transactions";
import { erc20Abi } from "../../utils/tokens";
import { fetchBlockscoutTokens, type TokenWithBalance } from "../../utils/blockscout";
import { getNativeTokenLogoUrls } from "../../utils/token-logos";
import { parseEip681 } from "../../utils/eip681";

const { address } = useConnection();
const chainId = useChainId();
const { data: nativeBalance } = useBalance({ address });
const client = useClient({ chainId });
const { addToast } = useToast();

// Tokens fetched from Blockscout
const fetchedTokens = ref<TokenWithBalance[]>([]);

async function fetchAvailableTokens() {
  if (!address.value || !chainId.value) {
    fetchedTokens.value = [];
    return;
  }
  try {
    fetchedTokens.value = await fetchBlockscoutTokens(chainId.value, address.value);
  } catch {
    fetchedTokens.value = [];
  }
}

// Token selection: null = native token
const selectedTokenAddress = ref<Address | null>(null);

const erc20Tokens = computed(() => fetchedTokens.value.filter((t) => !t.token.isNative));

const selectedEntry = computed(() =>
  erc20Tokens.value.find((t) => t.token.address === selectedTokenAddress.value),
);

const isTokenSend = computed(() => selectedTokenAddress.value !== null);

const nativeLogoUrls = computed(() => getNativeTokenLogoUrls(chainId.value ?? 1));

const currentLogoUrls = computed(() => selectedEntry.value?.logoUrls ?? nativeLogoUrls.value);

const currentSymbol = computed(() => {
  if (selectedEntry.value) return selectedEntry.value.token.symbol;
  return nativeBalance.value?.symbol ?? "ETH";
});

const currentDecimals = computed(() => {
  if (selectedEntry.value) return selectedEntry.value.token.decimals;
  return nativeBalance.value?.decimals ?? 18;
});

const currentBalance = computed(() => {
  if (selectedEntry.value) return selectedEntry.value.balance;
  return nativeBalance.value?.value ?? null;
});

// Fetch available tokens from Blockscout and reset selection when chain/address changes
watch(
  [chainId, address],
  () => {
    selectedTokenAddress.value = null;
    fetchAvailableTokens();
  },
  { immediate: true },
);

const recipient = ref("");
const amount = ref("");
const recipientError = ref<string | null>(null);
const amountError = ref<string | null>(null);
const submittedChainId = ref<number | null>(null);

const trackedChainId = computed(() =>
  resolveTransactionChainId(submittedChainId.value, chainId.value),
);
const receiptChainId = ref<number | undefined>(chainId.value);

const {
  sendTransaction,
  data: txHash,
  isPending: isSending,
  reset: resetSend,
} = useSendTransaction();

const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
  hash: txHash,
  chainId: receiptChainId,
});

const txStatus = computed(() => {
  if (receipt.value) return receipt.value.status === "success" ? "confirmed" : "failed";
  if (isConfirming.value) return "confirming";
  if (isSending.value) return "pending";
  return null;
});

const explorerUrl = computed(() => {
  if (!txHash.value || !trackedChainId.value) return "";
  return getExplorerTxUrl(trackedChainId.value, txHash.value);
});

async function setMax() {
  if (isTokenSend.value) {
    // For tokens, just use the full token balance
    if (currentBalance.value !== null) {
      amount.value = formatBalance(currentBalance.value, currentDecimals.value, 18);
      amountError.value = null;
    }
    return;
  }

  // Native token max (existing logic)
  recipientError.value = validateAddress(recipient.value);
  if (recipientError.value) {
    addToast("Enter a recipient address first", "info");
    return;
  }

  if (!nativeBalance.value || !address.value || !client.value) return;

  try {
    const [gasLimit, feeEstimate] = await Promise.all([
      estimateGas(client.value, {
        account: address.value,
        to: recipient.value as `0x${string}`,
        value: 0n,
      }),
      estimateFeesPerGas(client.value),
    ]);
    const feePerGas = feeEstimate.maxFeePerGas ?? feeEstimate.gasPrice;

    if (!feePerGas) {
      throw new Error("Could not estimate network fees. Try again");
    }

    const spendable = calculateMaxSendable(nativeBalance.value.value, gasLimit, feePerGas);
    if (spendable === null) {
      amountError.value = "Exceeds your balance";
      addToast("Not enough to cover the amount plus network fees", "error");
      return;
    }

    amount.value = formatBalance(spendable, nativeBalance.value.decimals, 18);
    amountError.value = null;
  } catch (err) {
    if (isUserRejection(err as Error)) {
      addToast("You cancelled the fee estimate", "info");
      return;
    }

    const short = (err as { shortMessage?: string; message?: string }).shortMessage;
    addToast(short ?? (err as Error).message ?? "Could not calculate max amount", "error");
  }
}

function handleSend() {
  recipientError.value = validateAddress(recipient.value);
  amountError.value = validateAmount(
    amount.value,
    currentBalance.value ?? undefined,
    currentDecimals.value,
  );
  if (recipientError.value || amountError.value) return;

  submittedChainId.value = chainId.value ?? null;

  if (isTokenSend.value && selectedEntry.value) {
    // ERC-20 transfer: call the token contract's transfer function
    const token = selectedEntry.value.token;
    const parsedAmount = parseUnits(amount.value, token.decimals);
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipient.value as Address, parsedAmount],
    });

    sendTransaction(
      {
        to: token.address,
        data,
        value: 0n,
      },
      {
        onSuccess() {
          addToast(`Sending ${token.symbol}...`, "success");
        },
        onError: handleSendError,
      },
    );
  } else {
    // Native ETH transfer
    sendTransaction(
      {
        to: recipient.value as `0x${string}`,
        value: parseEther(amount.value),
      },
      {
        onSuccess() {
          addToast("Transaction submitted", "success");
        },
        onError: handleSendError,
      },
    );
  }
}

function handleSendError(err: Error) {
  submittedChainId.value = null;
  if (isUserRejection(err)) {
    addToast("You cancelled the transaction", "info");
  } else {
    const short = (err as { shortMessage?: string }).shortMessage ?? err.message;
    addToast(short, "error");
  }
}

function resetForm() {
  recipient.value = "";
  amount.value = "";
  recipientError.value = null;
  amountError.value = null;
  submittedChainId.value = null;
  resetSend();
}

function selectToken(tb: TokenWithBalance | null) {
  selectedTokenAddress.value = tb?.token.address ?? null;
  amount.value = "";
  amountError.value = null;
}

watch(recipient, () => {
  recipientError.value = null;
});

watch(amount, () => {
  amountError.value = null;
});

watch(
  trackedChainId,
  (value) => {
    receiptChainId.value = value ?? undefined;
  },
  { immediate: true },
);

watch(receipt, (val) => {
  if (val) {
    if (val.status === "success") {
      addToast("Transaction confirmed", "success");
      // Refresh token list and balances after successful send
      if (isTokenSend.value) {
        fetchAvailableTokens();
      }
    } else {
      addToast("Transaction failed", "error");
    }
  }
});

// Token selector dropdown
const showTokenPicker = ref(false);

// QR scanner
const showScanner = ref(false);

function handleScanned(value: string) {
  showScanner.value = false;
  const parsed = parseEip681(value);

  if (!parsed) {
    addToast("No valid address found in this QR code", "error");
    return;
  }

  recipient.value = parsed.address;
  recipientError.value = null;

  // Pre-fill amount from EIP-681 value (native, in wei)
  if (parsed.value && !isTokenSend.value && nativeBalance.value) {
    try {
      amount.value = formatUnits(BigInt(parsed.value), nativeBalance.value.decimals);
      amountError.value = null;
    } catch {
      // Ignore parse errors, user can type amount manually
    }
  }

  // If ERC-20 transfer URI, try to select matching token and fill amount
  if (parsed.token) {
    const matchingToken = fetchedTokens.value.find(
      (t) => t.token.address.toLowerCase() === parsed.token!.toLowerCase(),
    );
    if (matchingToken) {
      selectToken(matchingToken);
      if (parsed.amount) {
        try {
          amount.value = formatUnits(BigInt(parsed.amount), matchingToken.token.decimals);
          amountError.value = null;
        } catch {
          // Ignore
        }
      }
    }
  }

  addToast("Address scanned", "success");
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Token selector -->
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Token</label>
      <PopoverRoot v-model:open="showTokenPicker">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-surface-100 dark:border-surface-600 dark:bg-surface-900 dark:hover:bg-surface-800"
            :disabled="isSending || isConfirming"
          >
            <TokenLogo :urls="currentLogoUrls" :symbol="currentSymbol" size="h-6 w-6" />
            <span class="flex-1 font-medium text-surface-900 dark:text-surface-100">
              {{ currentSymbol }}
            </span>
            <span v-if="currentBalance !== null" class="text-xs text-surface-400">
              {{ formatBalance(currentBalance, currentDecimals) }}
            </span>
            <ChevronDown class="h-4 w-4 shrink-0 text-surface-400" />
          </button>
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent
            class="popover-content z-[60] max-h-[min(20rem,var(--reka-popper-available-height))] w-[var(--reka-popper-anchor-width)] overflow-y-auto rounded-lg border border-surface-300 bg-white py-1 shadow-lg dark:border-surface-600 dark:bg-surface-900"
            :side-offset="4"
            :collision-padding="16"
            :avoid-collisions="true"
            align="start"
          >
            <!-- Native token option -->
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-100 active:bg-surface-200 dark:hover:bg-surface-800"
              :class="
                !isTokenSend
                  ? 'text-surface-900 dark:text-white font-semibold'
                  : 'text-surface-700 dark:text-surface-300'
              "
              @click="
                selectToken(null);
                showTokenPicker = false;
              "
            >
              <TokenLogo
                :urls="nativeLogoUrls"
                :symbol="nativeBalance?.symbol ?? 'ETH'"
                size="h-6 w-6"
              />
              {{ nativeBalance?.symbol ?? "ETH" }}
              <span class="ml-auto text-xs text-surface-400">Native</span>
            </button>

            <!-- ERC-20 tokens -->
            <button
              v-for="tb in erc20Tokens"
              :key="tb.token.address"
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-100 active:bg-surface-200 dark:hover:bg-surface-800"
              :class="
                selectedTokenAddress === tb.token.address
                  ? 'text-surface-900 dark:text-white font-semibold'
                  : 'text-surface-700 dark:text-surface-300'
              "
              @click="
                selectToken(tb);
                showTokenPicker = false;
              "
            >
              <TokenLogo :urls="tb.logoUrls" :symbol="tb.token.symbol" size="h-6 w-6" />
              {{ tb.token.symbol }}
              <span class="ml-auto max-w-24 truncate text-xs text-surface-400">
                {{ tb.token.name }}
              </span>
            </button>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Recipient</label>
      <div class="flex gap-2">
        <div class="min-w-0 flex-1">
          <BaseInput
            v-model="recipient"
            placeholder="0x..."
            :error="recipientError"
            :disabled="isSending || isConfirming"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
          />
        </div>
        <button
          type="button"
          class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-surface-300 bg-white text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSending || isConfirming"
          aria-label="Scan QR code"
          @click="showScanner = true"
        >
          <ScanLine class="h-5 w-5" />
        </button>
      </div>
    </div>

    <QrScanner v-if="showScanner" @scanned="handleScanned" @close="showScanner = false" />

    <div>
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Amount</label>
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-xs font-semibold text-surface-900 hover:bg-surface-100 dark:text-white dark:hover:bg-surface-800"
          :disabled="isSending || isConfirming || currentBalance === null"
          @click="setMax"
        >
          Max
        </button>
      </div>
      <BaseInput
        v-model="amount"
        :placeholder="`0.0 ${currentSymbol}`"
        :error="amountError"
        :disabled="isSending || isConfirming"
        inputmode="decimal"
        class="mt-1.5"
      />
    </div>

    <div class="flex items-center gap-3">
      <BaseButton
        variant="primary"
        :loading="isSending || isConfirming"
        class="flex-1"
        @click="handleSend"
      >
        {{
          isSending
            ? "Confirm in wallet..."
            : isConfirming
              ? "Confirming..."
              : `Send ${currentSymbol}`
        }}
      </BaseButton>
      <BaseButton v-if="txHash" variant="ghost" @click="resetForm"> New </BaseButton>
    </div>

    <div
      v-if="txStatus"
      class="flex items-center justify-between rounded-lg border border-surface-200 px-4 py-3 dark:border-surface-700"
    >
      <StatusBadge :status="txStatus" />
      <a
        v-if="explorerUrl"
        :href="explorerUrl"
        target="_blank"
        rel="noopener"
        class="text-xs font-medium text-surface-900 underline decoration-surface-400 hover:decoration-surface-900 dark:text-white dark:decoration-surface-500 dark:hover:decoration-white"
      >
        View on explorer
      </a>
    </div>
  </div>
</template>

<style scoped>
.popover-content[data-state="open"] {
  animation: popoverShow 150ms ease;
}
@keyframes popoverShow {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}
</style>
