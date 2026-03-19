import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const ACCOUNT = "0x1111111111111111111111111111111111111111";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("fetchTokenBalances", () => {
  it("merges Blockscout-discovered tokens with well-known tokens and reads balances via RPC", async () => {
    const multicall = vi.fn().mockResolvedValue([
      { status: "success", result: 5_000_000n },
      { status: "success", result: 0n },
      { status: "success", result: 3_000_000_000_000_000_000n },
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
              nativeCurrency: { symbol: "ETH", name: "Ether", decimals: 18 },
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
        createPublicClient: vi.fn(() => ({ getBalance, multicall })),
        http: vi.fn(),
      };
    });

    // Blockscout discovers an extra token not in wellKnownTokens
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              token: {
                address_hash: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                name: "USD Coin",
                symbol: "USDC",
                decimals: "6",
                icon_url: null,
                type: "ERC-20",
              },
            },
            {
              token: {
                address_hash: "0x3333333333333333333333333333333333333333",
                name: "New Token",
                symbol: "NEW",
                decimals: "18",
                icon_url: null,
                type: "ERC-20",
              },
            },
          ],
        }),
      }),
    );

    const { fetchTokenBalances } = await import("./token-balances");
    const result = await fetchTokenBalances(8453, ACCOUNT);

    expect(getBalance).toHaveBeenCalled();
    // multicall should include 2 well-known + 1 discovered (USDC deduplicated)
    expect(multicall).toHaveBeenCalledWith(
      expect.objectContaining({
        contracts: expect.arrayContaining([
          expect.objectContaining({
            address: "0x3333333333333333333333333333333333333333",
          }),
        ]),
      }),
    );

    // Native ETH + USDT (5M > 0) + NEW (3e18 > 0). USDC has 0 balance.
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      token: { isNative: true, symbol: "ETH" },
    });
  });

  it("falls back to well-known tokens when Blockscout discovery fails", async () => {
    const multicall = vi.fn().mockResolvedValue([{ status: "success", result: 5_000_000n }]);
    const getBalance = vi.fn().mockResolvedValue(1_000_000_000_000_000_000n);

    vi.doMock("./chains", async () => {
      const actual = await vi.importActual<typeof import("./chains")>("./chains");
      return {
        ...actual,
        chainMeta: {
          8453: {
            chain: {
              id: 8453,
              nativeCurrency: { symbol: "ETH", name: "Ether", decimals: 18 },
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
        ],
      },
    }));

    vi.doMock("viem", async () => {
      const actual = await vi.importActual<typeof import("viem")>("viem");
      return {
        ...actual,
        createPublicClient: vi.fn(() => ({ getBalance, multicall })),
        http: vi.fn(),
      };
    });

    vi.doMock("./token-logos", () => ({
      getChainLogoUrl: () => "https://example.com/chain.png",
      getNativeTokenLogoUrls: () => ["https://example.com/eth.png"],
      getTokenLogoUrls: () => ["https://example.com/token.png"],
    }));

    // Blockscout fails
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { fetchTokenBalances } = await import("./token-balances");
    const result = await fetchTokenBalances(8453, ACCOUNT);

    // Should still return native + well-known tokens via RPC
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ token: { isNative: true } });
    expect(result[1]).toMatchObject({ token: { symbol: "USDT" } });
  });

  it("returns empty array for unknown chain", async () => {
    vi.doMock("./chains", () => ({ chainMeta: {} }));
    vi.doMock("./well-known-tokens", () => ({ wellKnownTokens: {} }));
    vi.doMock("viem", async () => {
      const actual = await vi.importActual<typeof import("viem")>("viem");
      return { ...actual, createPublicClient: vi.fn(), http: vi.fn() };
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no")));

    const { fetchTokenBalances } = await import("./token-balances");
    const result = await fetchTokenBalances(12345, ACCOUNT);

    expect(result).toEqual([]);
  });
});
