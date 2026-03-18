// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const ADDRESS = "0x1111111111111111111111111111111111111111";

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-18T20:00:00.000Z"));
});

async function renderTransactionList(options?: { transactions?: any[]; rejectFetch?: boolean }) {
  const address = ref(ADDRESS);
  const chainId = ref(8453);
  const fetchBlockscoutTransactions = options?.rejectFetch
    ? vi.fn().mockRejectedValue(new Error("boom"))
    : vi.fn().mockResolvedValue(options?.transactions ?? []);

  vi.doMock("@wagmi/vue", () => ({
    useConnection: () => ({ address }),
    useChainId: () => chainId,
  }));

  vi.doMock("@vueuse/core", () => ({
    useTimeoutPoll: (
      callback: () => Promise<void>,
      _interval: number,
      options?: { immediateCallback?: boolean },
    ) => {
      if (options?.immediateCallback) {
        void callback();
      }
    },
  }));

  vi.doMock("../../utils/blockscout", () => ({
    fetchBlockscoutTransactions,
  }));

  const { default: TransactionList } = await import("./TransactionList.vue");
  const wrapper = mount(TransactionList);
  await flushPromises();

  return { wrapper, fetchBlockscoutTransactions };
}

describe("TransactionList", () => {
  it("shows the empty state when no transactions exist", async () => {
    const { wrapper } = await renderTransactionList();

    expect(wrapper.text()).toContain("No activity yet");
  });

  it("renders sent and contract interactions with explorer links", async () => {
    const { wrapper } = await renderTransactionList({
      transactions: [
        {
          hash: "0xsend",
          from: ADDRESS,
          to: "0x2222222222222222222222222222222222222222",
          value: "1500000000000000000",
          status: "ok",
          timestamp: "2026-03-18T19:45:00.000Z",
          method: null,
          fee: "12340000000000",
          toName: null,
          toIsContract: false,
          transactionTypes: [],
          protocol: null,
        },
        {
          hash: "0xapprove",
          from: "0x3333333333333333333333333333333333333333",
          to: "0x4444444444444444444444444444444444444444",
          value: "0",
          status: "error",
          timestamp: "2026-03-17T20:00:00.000Z",
          method: "approve",
          fee: "1200",
          toName: "Uniswap",
          toIsContract: true,
          transactionTypes: [],
          protocol: "Uniswap",
        },
      ],
    });

    expect(wrapper.text()).toContain("Send");
    expect(wrapper.text()).toContain("To: 0x2222...2222");
    expect(wrapper.text()).toContain("-1.5 ETH");
    expect(wrapper.text()).toContain("15m ago");
    expect(wrapper.text()).toContain("Approve");
    expect(wrapper.text()).toContain("Failed");
    expect(wrapper.text()).toContain("Fee: <0.0001");
    expect(wrapper.find('a[href="https://basescan.org/tx/0xsend"]').exists()).toBe(true);
  });

  it("falls back to the empty state after fetch failures", async () => {
    const { wrapper, fetchBlockscoutTransactions } = await renderTransactionList({
      rejectFetch: true,
    });

    expect(fetchBlockscoutTransactions).toHaveBeenCalled();
    expect(wrapper.text()).toContain("No activity yet");
  });
});
