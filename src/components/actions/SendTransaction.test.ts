// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const VALID_ADDRESS = "0x1111111111111111111111111111111111111111";
const OTHER_ADDRESS = "0x2222222222222222222222222222222222222222";
const TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const TX_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function renderSendTransaction(options?: {
  fetchedTokens?: any[];
  parsedQr?: {
    address: string;
    value?: string;
    token?: string;
    amount?: string;
  } | null;
  sendError?: Error;
  receiptStatus?: "success" | "reverted";
}) {
  const address = ref<`0x${string}`>(VALID_ADDRESS);
  const chainId = ref(8453);
  const balance = ref({
    value: 1_000_000_000_000_000_000n,
    decimals: 18,
    symbol: "ETH",
  });
  const txHash = ref<`0x${string}` | undefined>(undefined);
  const receipt = ref<null | { status: "success" | "reverted" }>(null);
  const isSending = ref(false);
  const estimateGas = vi.fn().mockResolvedValue(21_000n);
  const estimateFeesPerGas = vi.fn().mockResolvedValue({ maxFeePerGas: 10n });
  const addToast = vi.fn();
  const fetchTokenBalances = vi.fn().mockResolvedValue(options?.fetchedTokens ?? []);

  const sendTransaction = vi.fn(
    (
      _params: Record<string, unknown>,
      callbacks?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      if (options?.sendError) {
        callbacks?.onError?.(options.sendError);
        return;
      }

      txHash.value = TX_HASH;
      isSending.value = true;
      callbacks?.onSuccess?.();

      if (options?.receiptStatus) {
        receipt.value = { status: options.receiptStatus };
        isSending.value = false;
      }
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
      refetch: vi.fn(),
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

  vi.doMock("../../utils/token-balances", () => ({
    fetchTokenBalances,
    clearTokenCache: vi.fn(),
  }));

  vi.doMock("../../utils/blockscout", () => ({
    clearTransactionCache: vi.fn(),
  }));

  vi.doMock("@tanstack/vue-query", () => ({
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  }));

  vi.doMock("../../composables/useTransactionNotifier", () => ({
    notifyTransactionConfirmed: vi.fn(),
  }));

  vi.doMock("reka-ui", () => ({
    PopoverRoot: defineComponent({
      setup(_props, { slots }) {
        return () => h("div", slots.default?.());
      },
    }),
    PopoverTrigger: defineComponent({
      setup(_props, { slots }) {
        return () => h("div", slots.default?.());
      },
    }),
    PopoverPortal: defineComponent({
      setup(_props, { slots }) {
        return () => h("div", slots.default?.());
      },
    }),
    PopoverContent: defineComponent({
      setup(_props, { slots }) {
        return () => h("div", slots.default?.());
      },
    }),
  }));

  vi.doMock("../../utils/eip681", async () => {
    const actual = await vi.importActual<typeof import("../../utils/eip681")>("../../utils/eip681");
    return {
      ...actual,
      parseEip681: vi.fn().mockReturnValue(options?.parsedQr ?? null),
    };
  });

  vi.doMock("./QrScanner.vue", () => ({
    default: {
      template:
        "<button data-testid=\"qr-scanner\" @click=\"$emit('scanned', 'ethereum:scan')\">Scanner</button>",
    },
  }));

  const { default: SendTransaction } = await import("./SendTransaction.vue");
  const wrapper = mount(SendTransaction, {
    attachTo: document.body,
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
  await flushPromises();

  return {
    wrapper,
    chainId,
    estimateGas,
    estimateFeesPerGas,
    addToast,
    sendTransaction,
    fetchTokenBalances,
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
    expect(addToast).toHaveBeenCalledWith("Enter a recipient address first", "info");
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

  it("does not render the native token twice in the picker", async () => {
    const nativeToken = {
      token: {
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        isNative: true,
      },
      balance: 1_000_000_000_000_000_000n,
      logoUrls: [],
    };
    const erc20Token = {
      token: {
        address: TOKEN_ADDRESS,
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
      },
      balance: 2_000_000n,
      logoUrls: [],
    };

    const { wrapper } = await renderSendTransaction({
      fetchedTokens: [nativeToken, erc20Token],
    });

    const pickerTrigger = wrapper.findAll("button")[0];
    await pickerTrigger!.trigger("click");
    await nextTick();

    expect(wrapper.text()).toContain("USD Coin");
    expect(wrapper.text()).not.toContain("Ether");
  });

  it("sends ERC-20 transfers through the token contract", async () => {
    const { wrapper, sendTransaction, addToast } = await renderSendTransaction({
      fetchedTokens: [
        {
          token: {
            address: TOKEN_ADDRESS,
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
          },
          balance: 2_000_000n,
          logoUrls: [],
        },
      ],
    });

    await wrapper.findAll("button")[0]!.trigger("click");
    await nextTick();
    const usdcOption = wrapper
      .findAll("button")
      .find((button) => button.text().includes("USD Coin"));
    await usdcOption!.trigger("click");

    const [recipientInput, amountInput] = wrapper.findAll("input");
    await recipientInput!.setValue(OTHER_ADDRESS);
    await amountInput!.setValue("1.5");

    const sendButton = wrapper.findAll("button").find((button) => button.text().includes("Send"));
    await sendButton!.trigger("click");

    expect(sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        to: TOKEN_ADDRESS,
        value: 0n,
        data: expect.any(String),
      }),
      expect.any(Object),
    );
    expect(addToast).toHaveBeenCalledWith("Sending USDC...", "success");
  });

  it("prefills native transfers from a scanned EIP-681 QR code", async () => {
    const { wrapper, addToast } = await renderSendTransaction({
      parsedQr: {
        address: OTHER_ADDRESS,
        value: "250000000000000000",
      },
    });

    const scanButton = wrapper.get('button[aria-label="Scan QR code"]');
    await scanButton.trigger("click");
    await nextTick();
    await wrapper.get('[data-testid="qr-scanner"]').trigger("click");
    await nextTick();

    const [recipientInput, amountInput] = wrapper.findAll("input");
    expect((recipientInput!.element as HTMLInputElement).value).toBe(OTHER_ADDRESS);
    expect((amountInput!.element as HTMLInputElement).value).toBe("0.25");
    expect(addToast).toHaveBeenCalledWith("Address scanned", "success");
  });

  it("rejects invalid QR payloads", async () => {
    const { wrapper, addToast } = await renderSendTransaction({
      parsedQr: null,
    });

    await wrapper.get('button[aria-label="Scan QR code"]').trigger("click");
    await nextTick();
    await wrapper.get('[data-testid="qr-scanner"]').trigger("click");

    expect(addToast).toHaveBeenCalledWith("No valid address found in this QR code", "error");
  });

  it("toasts rejected send errors without leaving a submitted chain", async () => {
    const { wrapper, addToast } = await renderSendTransaction({
      sendError: Object.assign(new Error("Rejected"), { code: 4001 }),
    });

    const [recipientInput, amountInput] = wrapper.findAll("input");
    await recipientInput!.setValue(OTHER_ADDRESS);
    await amountInput!.setValue("0.1");

    const sendButton = wrapper.findAll("button").find((button) => button.text().includes("Send"));
    await sendButton!.trigger("click");
    await nextTick();

    expect(addToast).toHaveBeenCalledWith("You cancelled the transaction", "info");
    expect(wrapper.find('a[target="_blank"]').exists()).toBe(false);
  });

  it("refreshes token balances and shows a confirmation toast after a successful receipt", async () => {
    const { wrapper, addToast, fetchTokenBalances } = await renderSendTransaction({
      fetchedTokens: [
        {
          token: {
            address: TOKEN_ADDRESS,
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
          },
          balance: 2_000_000n,
          logoUrls: [],
        },
      ],
      receiptStatus: "success",
    });

    await wrapper.findAll("button")[0]!.trigger("click");
    await nextTick();
    const usdcOption = wrapper
      .findAll("button")
      .find((button) => button.text().includes("USD Coin"));
    await usdcOption!.trigger("click");

    const [recipientInput, amountInput] = wrapper.findAll("input");
    await recipientInput!.setValue(OTHER_ADDRESS);
    await amountInput!.setValue("1");

    const sendButton = wrapper.findAll("button").find((button) => button.text().includes("Send"));
    await sendButton!.trigger("click");
    await nextTick();

    expect(addToast).toHaveBeenCalledWith("Transaction confirmed", "success");
    expect(fetchTokenBalances).toHaveBeenCalledTimes(2);
  });
});
