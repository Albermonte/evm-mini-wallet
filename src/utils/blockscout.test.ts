import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const ACCOUNT = "0x1111111111111111111111111111111111111111";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("fetchBlockscoutTokens", () => {
  it("prepends the native token balance ahead of ERC-20 balances", async () => {
    const getBalance = vi.fn().mockResolvedValue(123_000_000_000_000_000n);

    vi.doMock("viem", async () => {
      const actual = await vi.importActual<typeof import("viem")>("viem");
      return {
        ...actual,
        createPublicClient: vi.fn(() => ({
          getBalance,
          multicall: vi.fn(),
        })),
        http: vi.fn(),
      };
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              token: {
                address_hash: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
                name: "USD Coin",
                symbol: "USDC",
                decimals: "6",
                icon_url: null,
                type: "ERC-20",
              },
              value: "2000000",
            },
          ],
          next_page_params: null,
        }),
      }),
    );

    const { fetchBlockscoutTokens } = await import("./blockscout");

    const result = await fetchBlockscoutTokens(137, ACCOUNT);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      token: {
        address: null,
        symbol: "POL",
        name: "POL",
        decimals: 18,
        isNative: true,
      },
      balance: 123_000_000_000_000_000n,
    });
    expect(result[1]).toMatchObject({
      token: {
        address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
      },
      balance: 2_000_000n,
    });
  });

  it("falls back to RPC when the Blockscout API fails", async () => {
    const multicall = vi.fn().mockResolvedValue([
      { status: "success", result: 5000000n },
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

    const fetchSpy = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchSpy);

    const { fetchBlockscoutTokens } = await import("./blockscout");
    const result = await fetchBlockscoutTokens(8453, ACCOUNT);

    expect(fetchSpy).toHaveBeenCalled();
    expect(getBalance).toHaveBeenCalled();
    expect(multicall).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("fetchBlockscoutTransactions", () => {
  it("maps blockscout transactions into the local transaction shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              hash: "0xhash",
              from: {
                hash: "0xfrom",
                name: null,
                is_contract: false,
                metadata: null,
              },
              to: {
                hash: "0xto",
                name: "Uniswap Router",
                is_contract: true,
                metadata: {
                  tags: [{ name: "Uniswap", tagType: "protocol" }],
                },
              },
              value: "100",
              status: "ok",
              timestamp: "2026-03-18T12:00:00Z",
              method: "swap",
              fee: { value: "5" },
              transaction_types: ["token_transfer"],
            },
          ],
          next_page_params: null,
        }),
      }),
    );

    const { fetchBlockscoutTransactions } = await import("./blockscout");
    const result = await fetchBlockscoutTransactions(8453, ACCOUNT);

    expect(result).toEqual([
      {
        hash: "0xhash",
        from: "0xfrom",
        to: "0xto",
        value: "100",
        status: "ok",
        timestamp: "2026-03-18T12:00:00Z",
        method: "swap",
        fee: "5",
        toName: "Uniswap Router",
        toIsContract: true,
        transactionTypes: ["token_transfer"],
        protocol: "Uniswap",
      },
    ]);
  });

  it("returns an empty list when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const { fetchBlockscoutTransactions } = await import("./blockscout");
    await expect(fetchBlockscoutTransactions(8453, ACCOUNT)).resolves.toEqual([]);
  });
});
