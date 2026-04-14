// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const FAKE_ADDRESS = "0x2222222222222222222222222222222222222222";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.doUnmock("../utils/price-cache");
});

async function renderPortfolio(options?: {
  chainId?: number;
  fetchTokens?: ReturnType<typeof vi.fn>;
  fetchPrices?: ReturnType<typeof vi.fn>;
}) {
  const address = ref(ADDRESS);
  const chainId = ref(options?.chainId ?? 8453);

  const fetchTokenBalances =
    options?.fetchTokens ??
    vi.fn().mockResolvedValue([
      {
        token: {
          address: null,
          symbol: "ETH",
          name: "Ether",
          decimals: 18,
          isNative: true,
        },
        balance: 1_500_000_000_000_000_000n,
        logoUrls: ["https://example.com/eth.png"],
      },
      {
        token: {
          address: USDC_ADDRESS,
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
        },
        balance: 2_000_000n,
        logoUrls: ["https://example.com/usdc.png"],
      },
      {
        token: {
          address: FAKE_ADDRESS,
          symbol: "FAKE",
          name: "Fake Token",
          decimals: 18,
        },
        balance: 4_000_000_000_000_000_000n,
        logoUrls: [],
      },
    ]);

  const fetchTokenPrices =
    options?.fetchPrices ??
    vi.fn().mockResolvedValue({
      "native:ETH": 2000,
      [USDC_ADDRESS]: 1,
      [FAKE_ADDRESS]: 5,
    });

  vi.doMock("@wagmi/vue", () => ({
    useConnection: () => ({ address }),
    useChainId: () => chainId,
  }));

  vi.doMock("../utils/token-balances", () => ({
    fetchTokenBalances,
  }));

  vi.doMock("../utils/prices", () => ({
    calculateFiatValue: (balance: bigint, decimals: number, price: number | null) => {
      if (price === null) return null;
      return (Number(balance) / 10 ** decimals) * price;
    },
    fetchTokenPrices,
  }));

  const { usePortfolio } = await import("./usePortfolio");

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  let portfolio: ReturnType<typeof usePortfolio> | undefined;

  const Harness = defineComponent({
    setup() {
      portfolio = usePortfolio();
      return () => h("div");
    },
  });

  mount(Harness, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });

  await flushPromises();

  if (!portfolio) {
    throw new Error("Portfolio composable did not initialize");
  }

  return {
    address,
    chainId,
    fetchTokenBalances,
    fetchTokenPrices,
    portfolio,
    queryClient,
  };
}

describe("usePortfolio", () => {
  it("shares query-backed portfolio data across separate consumers", async () => {
    const address = ref(ADDRESS);
    const chainId = ref(8453);
    const fetchTokenBalances = vi.fn().mockResolvedValue([
      {
        token: {
          address: null,
          symbol: "ETH",
          name: "Ether",
          decimals: 18,
          isNative: true,
        },
        balance: 1_000_000_000_000_000_000n,
        logoUrls: ["https://example.com/eth.png"],
      },
      {
        token: {
          address: USDC_ADDRESS,
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
        },
        balance: 2_000_000n,
        logoUrls: ["https://example.com/usdc.png"],
      },
    ]);
    const fetchTokenPrices = vi.fn().mockResolvedValue({
      "native:ETH": 2000,
      [USDC_ADDRESS]: 1,
    });

    vi.doMock("@wagmi/vue", () => ({
      useConnection: () => ({ address }),
      useChainId: () => chainId,
    }));

    vi.doMock("../utils/token-balances", () => ({
      fetchTokenBalances,
    }));

    vi.doMock("../utils/prices", () => ({
      calculateFiatValue: (balance: bigint, decimals: number, price: number | null) => {
        if (price === null) return null;
        return (Number(balance) / 10 ** decimals) * price;
      },
      fetchTokenPrices,
    }));

    const { usePortfolio } = await import("./usePortfolio");
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    let portfolioA: ReturnType<typeof usePortfolio> | undefined;
    let portfolioB: ReturnType<typeof usePortfolio> | undefined;

    const Harness = defineComponent({
      setup() {
        portfolioA = usePortfolio();
        portfolioB = usePortfolio();
        return () => h("div");
      },
    });

    mount(Harness, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    });

    await flushPromises();

    if (!portfolioA || !portfolioB) {
      throw new Error("Portfolio composables did not initialize");
    }

    expect(portfolioA.portfolioTotalFiat.value).toBe(2002);
    expect(portfolioB.portfolioTotalFiat.value).toBe(2002);
    expect(portfolioA.status.value).toBe("success");
    expect(portfolioB.status.value).toBe("success");
  });

  it("fetches prices for all returned tokens instead of gating on logo trust", async () => {
    const fetchTokenPrices = vi.fn().mockResolvedValue({
      "native:ETH": 2000,
      [USDC_ADDRESS]: 1,
      [FAKE_ADDRESS]: 5,
    });

    const { portfolio } = await renderPortfolio({ fetchPrices: fetchTokenPrices });

    expect(fetchTokenPrices).toHaveBeenCalledWith(
      8453,
      [
        {
          address: null,
          symbol: "ETH",
          name: "Ether",
          decimals: 18,
          isNative: true,
        },
        {
          address: USDC_ADDRESS,
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
        },
        {
          address: FAKE_ADDRESS,
          symbol: "FAKE",
          name: "Fake Token",
          decimals: 18,
        },
      ],
      "usd",
    );
    expect(portfolio.portfolioTotalFiat.value).toBe(3022);
  });

  it("includes priced ERC-20 value without waiting for logo trust", async () => {
    const { portfolio } = await renderPortfolio();

    expect(portfolio.tokens.value).toHaveLength(3);
    expect(portfolio.portfolioTotalFiat.value).toBe(3022);
  });

  it("ignores trusted tokens that still have no price", async () => {
    const fetchTokenPrices = vi.fn().mockResolvedValue({
      "native:ETH": 2000,
      [USDC_ADDRESS]: null,
    });

    const { portfolio } = await renderPortfolio({
      fetchTokens: vi.fn().mockResolvedValue([
        {
          token: {
            address: null,
            symbol: "ETH",
            name: "Ether",
            decimals: 18,
            isNative: true,
          },
          balance: 1_000_000_000_000_000_000n,
          logoUrls: ["https://example.com/eth.png"],
        },
        {
          token: {
            address: USDC_ADDRESS,
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
          },
          balance: 5_000_000n,
          logoUrls: ["https://example.com/usdc.png"],
        },
      ]),
      fetchPrices: fetchTokenPrices,
    });

    expect(portfolio.portfolioTotalFiat.value).toBe(2000);
  });

  it("refetches when the cache only contains null prices for current tokens", async () => {
    const fetchTokenPrices = vi.fn().mockResolvedValue({
      "native:ETH": 2000,
      [USDC_ADDRESS]: 1,
      [FAKE_ADDRESS]: 5,
    });

    vi.doMock("../utils/price-cache", () => ({
      getCachedPrices: vi.fn().mockResolvedValue({
        "native:ETH": null,
        [USDC_ADDRESS]: null,
        [FAKE_ADDRESS]: null,
      }),
      setCachedPrices: vi.fn().mockResolvedValue(undefined),
    }));

    const { portfolio } = await renderPortfolio({ fetchPrices: fetchTokenPrices });

    expect(fetchTokenPrices).toHaveBeenCalledTimes(1);
    expect(portfolio.portfolioTotalFiat.value).toBe(3022);
  });

  it("surfaces token fetch failures as an error state", async () => {
    const { portfolio } = await renderPortfolio({
      fetchTokens: vi.fn().mockRejectedValue(new Error("boom")),
    });

    expect(portfolio.status.value).toBe("error");
    expect(portfolio.tokens.value).toEqual([]);
    expect(portfolio.error.value?.message).toBe("boom");
  });

  it("recomputes portfolio state when the chain changes", async () => {
    const fetchTokenBalances = vi
      .fn()
      .mockResolvedValueOnce([
        {
          token: {
            address: null,
            symbol: "ETH",
            name: "Ether",
            decimals: 18,
            isNative: true,
          },
          balance: 1_000_000_000_000_000_000n,
          logoUrls: ["https://example.com/eth.png"],
        },
        {
          token: {
            address: USDC_ADDRESS,
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
          },
          balance: 2_000_000n,
          logoUrls: ["https://example.com/usdc.png"],
        },
      ])
      .mockResolvedValueOnce([
        {
          token: {
            address: null,
            symbol: "ETH",
            name: "Ether",
            decimals: 18,
            isNative: true,
          },
          balance: 500_000_000_000_000_000n,
          logoUrls: ["https://example.com/eth.png"],
        },
      ]);

    const fetchTokenPrices = vi
      .fn()
      .mockResolvedValueOnce({
        "native:ETH": 2000,
        [USDC_ADDRESS]: 1,
      })
      .mockResolvedValueOnce({
        "native:ETH": 2100,
      });

    const { chainId, portfolio } = await renderPortfolio({
      fetchTokens: fetchTokenBalances,
      fetchPrices: fetchTokenPrices,
    });

    expect(portfolio.portfolioTotalFiat.value).toBe(2002);

    chainId.value = 10;
    await flushPromises();

    expect(portfolio.portfolioTotalFiat.value).toBe(1050);
    expect(portfolio.scopeKey.value).toBe(`10:${ADDRESS.toLowerCase()}`);
  });
});
