import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("CoinGecko chain mapping", () => {
  it("maps supported chains to CoinGecko platform ids", async () => {
    const { getCoinGeckoPlatformId } = await import("./prices");

    expect(getCoinGeckoPlatformId(1)).toBe("ethereum");
    expect(getCoinGeckoPlatformId(137)).toBe("polygon-pos");
    expect(getCoinGeckoPlatformId(8453)).toBe("base");
    expect(getCoinGeckoPlatformId(56)).toBe("binance-smart-chain");
    expect(getCoinGeckoPlatformId(11155111)).toBeNull();
  });

  it("maps supported chains to CoinGecko native coin ids", async () => {
    const { getCoinGeckoNativeCoinId } = await import("./prices");

    expect(getCoinGeckoNativeCoinId(1)).toBe("ethereum");
    expect(getCoinGeckoNativeCoinId(10)).toBe("ethereum");
    expect(getCoinGeckoNativeCoinId(137)).toBe("polygon-ecosystem-token");
    expect(getCoinGeckoNativeCoinId(56)).toBe("binancecoin");
    expect(getCoinGeckoNativeCoinId(11155111)).toBeNull();
  });
});

describe("fetchTokenPrices", () => {
  it("fetches native and ERC-20 prices and normalizes lowercase address keys", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ethereum: {
            usd: 2183.51,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": {
            usd: 0.999893,
          },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { fetchTokenPrices } = await import("./prices");

    const prices = await fetchTokenPrices(
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
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
        },
      ],
      "usd",
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&vs_currencies=usd",
    );
    expect(prices).toEqual({
      "native:ETH": 2183.51,
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": 0.999893,
    });
  });

  it("returns null prices when CoinGecko omits an asset", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { fetchTokenPrices } = await import("./prices");

    const prices = await fetchTokenPrices(
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
          address: "0x3333333333333333333333333333333333333333",
          symbol: "FAKE",
          name: "Fake Token",
          decimals: 18,
        },
      ],
      "usd",
    );

    expect(prices).toEqual({
      "native:ETH": null,
      "0x3333333333333333333333333333333333333333": null,
    });
  });
});
