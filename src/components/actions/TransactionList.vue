<script setup lang="ts">
import { watch, ref, computed } from "vue";
import { useConnection, useChainId } from "@wagmi/vue";
import { useTimeoutPoll } from "@vueuse/core";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  ArrowLeftRight,
  ArrowDown,
  ArrowUp,
  Link,
  Settings,
  Clock,
} from "lucide-vue-next";
import { fetchBlockscoutTransactions, type Transaction } from "../../utils/blockscout";
import { getExplorerTxUrl, chainMeta } from "../../utils/chains";
import { formatBalance, truncateAddress } from "../../utils/format";
import { formatUnits } from "viem";

const { address } = useConnection();
const chainId = useChainId();

const transactions = ref<Transaction[]>([]);
const isLoading = ref(false);

async function fetchTransactions() {
  if (!address.value || !chainId.value) {
    transactions.value = [];
    return;
  }

  isLoading.value = true;
  try {
    transactions.value = await fetchBlockscoutTransactions(chainId.value, address.value);
  } catch {
    transactions.value = [];
  }
  isLoading.value = false;
}

useTimeoutPoll(fetchTransactions, 30_000, { immediateCallback: true });
watch([chainId, address], fetchTransactions);

function isSent(tx: Transaction): boolean {
  return tx.from.toLowerCase() === address.value?.toLowerCase();
}

function peerAddress(tx: Transaction): string {
  if (isSent(tx)) return tx.to ?? "";
  return tx.from;
}

function actionLabel(tx: Transaction): string {
  if (!tx.method) {
    return isSent(tx) ? "Send" : "Receive";
  }
  const m = tx.method.toLowerCase();
  if (m === "approve") return "Approve";
  if (m === "transfer" || m === "transferfrom") return isSent(tx) ? "Send" : "Receive";
  if (m.includes("swap") || m === "execute") return "Swap";
  if (m.includes("deposit") || m.includes("supply")) return "Deposit";
  if (m.includes("withdraw") || m.includes("redeem")) return "Withdraw";
  if (m.includes("bridge") || m.includes("sendmessage")) return "Bridge";
  if (m.includes("claim") || m.includes("harvest")) return "Claim";
  if (m.includes("stake")) return "Stake";
  if (m.includes("unstake")) return "Unstake";
  if (m.includes("mint")) return "Mint";
  if (m.startsWith("0x")) return "Contract Call";
  // Capitalize first letter of method name
  return tx.method.charAt(0).toUpperCase() + tx.method.slice(1);
}

interface IconStyle {
  bg: string;
  color: string;
}

function iconStyle(tx: Transaction): IconStyle {
  const label = actionLabel(tx);
  switch (label) {
    case "Approve":
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        color: "text-yellow-600 dark:text-yellow-400",
      };
    case "Swap":
      return {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        color: "text-purple-600 dark:text-purple-400",
      };
    case "Deposit":
    case "Stake":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        color: "text-blue-600 dark:text-blue-400",
      };
    case "Withdraw":
    case "Unstake":
    case "Claim":
      return {
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
        color: "text-cyan-600 dark:text-cyan-400",
      };
    case "Bridge":
      return {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        color: "text-indigo-600 dark:text-indigo-400",
      };
    case "Mint":
    case "Contract Call":
      return {
        bg: "bg-surface-100 dark:bg-surface-800",
        color: "text-surface-600 dark:text-surface-400",
      };
    default:
      return isSent(tx)
        ? { bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-600 dark:text-red-400" }
        : { bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600 dark:text-green-400" };
  }
}

function subtitle(tx: Transaction): string {
  const label = actionLabel(tx);

  // For simple transfers, show peer address
  if (label === "Send" || label === "Receive") {
    const peer = peerAddress(tx);
    if (!peer) return "Contract Creation";
    const prefix = label === "Send" ? "To" : "From";
    return `${prefix}: ${truncateAddress(peer)}`;
  }

  // For contract interactions, show protocol or contract name + target
  const parts: string[] = [];
  if (tx.protocol) {
    parts.push(tx.protocol);
  } else if (tx.toName) {
    parts.push(tx.toName);
  }

  if (tx.to) {
    if (parts.length > 0) {
      parts.push(`(${truncateAddress(tx.to)})`);
    } else {
      parts.push(truncateAddress(tx.to));
    }
  }

  return parts.join(" ") || "Unknown";
}

function formatValue(value: string): string {
  return formatBalance(BigInt(value), 18, 4);
}

function hasValue(tx: Transaction): boolean {
  return BigInt(tx.value) > 0n;
}

function formatFee(fee: string): string {
  const formatted = formatUnits(BigInt(fee), 18);
  const num = Number.parseFloat(formatted);
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toFixed(4);
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const nativeSymbol = computed(() => chainMeta[chainId.value]?.chain.nativeCurrency.symbol ?? "ETH");

const recentTransactions = computed(() => transactions.value.slice(0, 10));
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="isLoading && transactions.length === 0" class="flex flex-col gap-1">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-2 py-3.5">
        <div
          class="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <div class="h-5 w-14 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div class="h-5 w-16 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
          </div>
          <div class="mt-1.5 h-4 w-36 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        </div>
        <div class="shrink-0 text-right">
          <div class="ml-auto h-5 w-16 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div
            class="ml-auto mt-1.5 h-4 w-12 animate-pulse rounded bg-surface-200 dark:bg-surface-700"
          />
        </div>
      </div>
    </div>

    <!-- Transaction list -->
    <div v-else-if="recentTransactions.length > 0" class="flex flex-col gap-1">
      <a
        v-for="tx in recentTransactions"
        :key="tx.hash"
        :href="getExplorerTxUrl(chainId, tx.hash)"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800/50"
      >
        <!-- Action icon -->
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          :class="[iconStyle(tx).bg, iconStyle(tx).color]"
        >
          <ArrowUpRight v-if="actionLabel(tx) === 'Send'" class="h-4 w-4" />
          <ArrowDownLeft v-else-if="actionLabel(tx) === 'Receive'" class="h-4 w-4" />
          <Check v-else-if="actionLabel(tx) === 'Approve'" class="h-4 w-4" />
          <ArrowLeftRight v-else-if="actionLabel(tx) === 'Swap'" class="h-4 w-4" />
          <ArrowDown
            v-else-if="actionLabel(tx) === 'Deposit' || actionLabel(tx) === 'Stake'"
            class="h-4 w-4"
          />
          <ArrowUp
            v-else-if="
              actionLabel(tx) === 'Withdraw' ||
              actionLabel(tx) === 'Unstake' ||
              actionLabel(tx) === 'Claim'
            "
            class="h-4 w-4"
          />
          <Link v-else-if="actionLabel(tx) === 'Bridge'" class="h-4 w-4" />
          <Settings v-else class="h-4 w-4" />
        </div>

        <!-- Tx info -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-surface-900 dark:text-surface-100">
              {{ actionLabel(tx) }}
            </span>
            <span
              v-if="tx.protocol"
              class="truncate rounded-full bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400"
            >
              {{ tx.protocol }}
            </span>
            <span
              v-if="tx.status === 'error'"
              class="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
            >
              Failed
            </span>
          </div>
          <p class="truncate text-xs text-surface-400 dark:text-surface-500">
            {{ subtitle(tx) }}
          </p>
        </div>

        <!-- Value & time -->
        <div class="shrink-0 text-right">
          <p
            v-if="hasValue(tx)"
            class="text-sm font-medium"
            :class="
              isSent(tx) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            "
          >
            {{ isSent(tx) ? "-" : "+" }}{{ formatValue(tx.value) }} {{ nativeSymbol }}
          </p>
          <p
            v-else
            class="text-[11px] text-surface-400 dark:text-surface-500"
            :title="`Fee: ${formatFee(tx.fee)} ETH`"
          >
            Fee: {{ formatFee(tx.fee) }}
          </p>
          <p class="text-[11px] text-surface-400 dark:text-surface-500">
            {{ formatTime(tx.timestamp) }}
          </p>
        </div>
      </a>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading" class="flex flex-col items-center gap-3 py-12 text-center">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
      >
        <Clock class="h-6 w-6 text-surface-400 dark:text-surface-500" />
      </div>
      <div class="flex flex-col gap-1">
        <p class="text-base font-medium text-surface-700 dark:text-surface-300">No activity yet</p>
        <p class="text-sm text-surface-400 dark:text-surface-500">
          Your transactions will appear here once you send or receive tokens
        </p>
      </div>
    </div>
  </div>
</template>
