// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const VALID_ADDRESS = "0x1111111111111111111111111111111111111111";
const OTHER_ADDRESS = "0x2222222222222222222222222222222222222222";
const TX_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function renderSendTransaction() {
  const address = ref<`0x${string}`>(VALID_ADDRESS);
  const chainId = ref(8453);
  const balance = ref({
    value: 1_000_000_000_000_000_000n,
    decimals: 18,
    symbol: "ETH",
  });
  const txHash = ref<`0x${string}` | undefined>(undefined);
  const receipt = ref<null>(null);
  const isSending = ref(false);
  const estimateGas = vi.fn().mockResolvedValue(21_000n);
  const estimateFeesPerGas = vi.fn().mockResolvedValue({ maxFeePerGas: 10n });
  const addToast = vi.fn();

  const sendTransaction = vi.fn(
    (
      _params: { to: `0x${string}`; value: bigint },
      callbacks?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      txHash.value = TX_HASH;
      isSending.value = true;
      callbacks?.onSuccess?.();
    },
  );

  vi.doMock("@wagmi/vue", () => ({
    useConnection: () => ({
      address,
      chainId,
    }),
    useChainId: () => chainId,
    useBalance: () => ({
      data: balance,
    }),
    useClient: () => ref({}),
    useSendTransaction: () => ({
      sendTransaction,
      data: txHash,
      isPending: isSending,
      reset: () => {
        txHash.value = undefined;
        isSending.value = false;
      },
    }),
    useWaitForTransactionReceipt: () => ({
      data: receipt,
      isLoading: ref(false),
    }),
  }));

  vi.doMock("viem/actions", () => ({
    estimateGas,
    estimateFeesPerGas,
  }));

  vi.doMock("../../composables/useToast", () => ({
    useToast: () => ({
      addToast,
    }),
  }));

  const { default: SendTransaction } = await import("./SendTransaction.vue");
  const wrapper = mount(SendTransaction);

  return {
    wrapper,
    chainId,
    estimateGas,
    estimateFeesPerGas,
    addToast,
    sendTransaction,
  };
}

describe("SendTransaction", () => {
  it("requires a valid recipient before calculating Max", async () => {
    const { wrapper, estimateGas, estimateFeesPerGas, addToast } = await renderSendTransaction();

    const maxButton = wrapper.findAll("button").find((button) => button.text().trim() === "Max");
    expect(maxButton).toBeTruthy();

    await maxButton!.trigger("click");
    await nextTick();

    const inputs = wrapper.findAll("input");
    expect((inputs[1]!.element as HTMLInputElement).value).toBe("");
    expect(estimateGas).not.toHaveBeenCalled();
    expect(estimateFeesPerGas).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith("Enter a valid recipient before using Max", "info");
  });

  it("keeps explorer links pinned to the submitted chain", async () => {
    const { wrapper, chainId, sendTransaction } = await renderSendTransaction();

    const [recipientInput, amountInput] = wrapper.findAll("input");
    await recipientInput!.setValue(OTHER_ADDRESS);
    await amountInput!.setValue("0.1");

    const sendButton = wrapper.findAll("button").find((button) => button.text().includes("Send"));
    expect(sendButton).toBeTruthy();

    await sendButton!.trigger("click");
    await nextTick();
    expect(sendTransaction).toHaveBeenCalled();

    chainId.value = 1;
    await nextTick();

    const explorerLink = wrapper.get('a[target="_blank"]');
    expect(explorerLink.attributes("href")).toContain("basescan.org/tx/");
  });
});
