import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const ACCOUNT = "0x1111111111111111111111111111111111111111";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("fetchTokenBalances", () => {
  it("returns native token and well-known ERC-20 balances via RPC", async () => {
    const multicall = vi.fn().mockResolvedValue([
      { status: "success", result: 5_000_000n },
      { status: "failure", result: 0n },
    ]);
    const getBalance = vi.fn().mockResolvedValue(1_000_000_000_000_000_000n);

    vi.doMock("./chains", async () => {
      const actual = await vi.importActual<typeof import("./chains")>("./chains");
      return {
        ...actual,
        chainMeta: {
          8453: {
            chain: {
              id: 8453,
              nativeCurrency: {
                symbol: "ETH",
                name: "Ether",
                decimals: 18,
              },
            },
            color: "#0052FF",
            explorerUrl: "https://basescan.org",
            logo: "base.png",
          },
        },
      };
    });

    vi.doMock("./well-known-tokens", () => ({
      wellKnownTokens: {
        8453: [
          {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            symbol: "USDT",
            name: "Tether USD",
            decimals: 6,
          },
          {
            address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
          },
        ],
      },
    }));

    vi.doMock("viem", async () => {
      const actual = await vi.importActual<typeof import("viem")>("viem");
      return {
        ...actual,
        createPublicClient: vi.fn(() => ({
          getBalance,
          multicall,
        })),
        http: vi.fn(),
      };
    });

    const { fetchTokenBalances } = await import("./token-balances");
    const result = await fetchTokenBalances(8453, ACCOUNT);

    expect(getBalance).toHaveBeenCalled();
    expect(multicall).toHaveBeenCalled();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]).toMatchObject({
      token: {
        address: null,
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        isNative: true,
      },
      balance: 1_000_000_000_000_000_000n,
    });
  });

  it("returns only native token when no well-known tokens exist for chain", async () => {
    const getBalance = vi.fn().mockResolvedValue(500_000_000_000_000_000n);

    vi.doMock("./chains", async () => {
      const actual = await vi.importActual<typeof import("./chains")>("./chains");
      return {
        ...actual,
        chainMeta: {
          999: {
            chain: {
              id: 999,
              nativeCurrency: {
                symbol: "ETH",
                name: "Ether",
                decimals: 18,
              },
            },
            color: "#000",
            explorerUrl: "https://example.com",
            logo: "test.png",
          },
        },
      };
    });

    vi.doMock("./well-known-tokens", () => ({
      wellKnownTokens: {},
    }));

    vi.doMock("viem", async () => {
      const actual = await vi.importActual<typeof import("viem")>("viem");
      return {
        ...actual,
        createPublicClient: vi.fn(() => ({
          getBalance,
        })),
        http: vi.fn(),
      };
    });

    const { fetchTokenBalances } = await import("./token-balances");
    const result = await fetchTokenBalances(999, ACCOUNT);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      token: { isNative: true, symbol: "ETH" },
      balance: 500_000_000_000_000_000n,
    });
  });

  it("returns empty array for unknown chain", async () => {
    vi.doMock("./chains", () => ({
      chainMeta: {},
    }));

    vi.doMock("./well-known-tokens", () => ({
      wellKnownTokens: {},
    }));

    vi.doMock("viem", async () => {
      const actual = await vi.importActual<typeof import("viem")>("viem");
      return { ...actual, createPublicClient: vi.fn(), http: vi.fn() };
    });

    const { fetchTokenBalances } = await import("./token-balances");
    const result = await fetchTokenBalances(12345, ACCOUNT);

    expect(result).toEqual([]);
  });
});
