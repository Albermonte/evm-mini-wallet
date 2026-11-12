import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const ACCOUNT = "0x2e5E51c0f8BD4986cdd23b644c32535D5554EFB6";
const PEER = "0xcE8483e726fad8fB3c887b4C721b4DC8de0F5790";
const USDT = "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

function nativeTx(overrides: Record<string, unknown> = {}) {
  return {
    txHash: "0xnative",
    txStatus: "1",
    blockTimestamp: 1_700_000_000,
    from: { address: ACCOUNT },
    to: { address: PEER },
    method: { callType: "NATIVE_TRANSFER", methodHash: "", methodName: "Native Transfer" },
    value: "1000000000000000000",
    gasUsed: "21000",
    gasPrice: "10",
    ...overrides,
  };
}

function stubFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchGlacierTransactions", () => {
  it("maps native transfers with fee and status", async () => {
    const fetchMock = stubFetch({ transactions: [{ nativeTransaction: nativeTx() }] });
    const { fetchGlacierTransactions } = await import("./glacier");

    const result = await fetchGlacierTransactions(43114, ACCOUNT);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://glacier-api.avax.network/v1/chains/43114/addresses/${ACCOUNT}/transactions?pageSize=50`,
    );
    expect(result).toEqual([
      expect.objectContaining({
        hash: "0xnative",
        from: ACCOUNT,
        to: PEER,
        value: "1000000000000000000",
        status: "ok",
        timestamp: "2023-11-14T22:13:20.000Z",
        method: null,
        fee: "210000",
      }),
    ]);
  });

  it("emits the parent call and a token row for sent ERC-20 transfers", async () => {
    stubFetch({
      transactions: [
        {
          nativeTransaction: nativeTx({
            txHash: "0xtoken",
            to: { address: USDT },
            value: "0",
            method: { callType: "CONTRACT_CALL", methodHash: "0xa9059cbb" },
          }),
          erc20Transfers: [
            {
              from: { address: ACCOUNT },
              to: { address: PEER },
              logIndex: 7,
              value: "1210000",
              erc20Token: {
                ercType: "ERC-20",
                address: USDT,
                name: "TetherToken",
                symbol: "USDT",
                decimals: 6,
              },
            },
          ],
        },
      ],
    });
    const { fetchGlacierTransactions } = await import("./glacier");

    const result = await fetchGlacierTransactions(43114, ACCOUNT);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ hash: "0xtoken", method: "transfer", toIsContract: true });
    expect(result[1]).toMatchObject({
      hash: "0xtoken",
      from: ACCOUNT,
      to: PEER,
      logIndex: 7,
      tokenTransfer: {
        contract: USDT,
        symbol: "USDT",
        decimals: 6,
        amount: "1210000",
        type: "ERC-20",
      },
    });
  });

  it("skips the parent tx of incoming transfers the wallet did not send", async () => {
    stubFetch({
      transactions: [
        {
          nativeTransaction: nativeTx({
            from: { address: PEER },
            to: { address: USDT },
            value: "0",
            method: { callType: "CONTRACT_CALL", methodHash: "0xa9059cbb" },
          }),
          erc721Transfers: [
            {
              from: { address: PEER },
              to: { address: ACCOUNT },
              logIndex: 3,
              erc721Token: { ercType: "ERC-721", address: "0xnft", symbol: "NFT", tokenId: "9" },
            },
          ],
        },
      ],
    });
    const { fetchGlacierTransactions } = await import("./glacier");

    const result = await fetchGlacierTransactions(43114, ACCOUNT);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      to: ACCOUNT,
      tokenTransfer: { type: "ERC-721", amount: "1", decimals: 0 },
    });
  });

  it("marks failed transactions as errors", async () => {
    stubFetch({ transactions: [{ nativeTransaction: nativeTx({ txStatus: "0" }) }] });
    const { fetchGlacierTransactions } = await import("./glacier");

    const [tx] = await fetchGlacierTransactions(43114, ACCOUNT);
    expect(tx?.status).toBe("error");
  });

  it("throws a load error on non-ok responses", async () => {
    stubFetch({}, false);
    const { fetchGlacierTransactions } = await import("./glacier");

    await expect(fetchGlacierTransactions(43114, ACCOUNT)).rejects.toThrow(
      "Could not load activity",
    );
  });

  it("rejects chains not served by Glacier as unsupported", async () => {
    const { fetchGlacierTransactions } = await import("./glacier");
    const { UnsupportedChainFeatureError } = await import("./errors");

    await expect(fetchGlacierTransactions(56, ACCOUNT)).rejects.toBeInstanceOf(
      UnsupportedChainFeatureError,
    );
  });
});

describe("discoverGlacierTokens", () => {
  it("returns discovered ERC-20 tokens", async () => {
    const fetchMock = stubFetch({
      erc20TokenBalances: [
        { ercType: "ERC-20", address: USDT, name: "TetherToken", symbol: "USDT", decimals: 6 },
      ],
    });
    const { discoverGlacierTokens } = await import("./glacier");

    const tokens = await discoverGlacierTokens(43114, ACCOUNT);

    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      `/v1/chains/43114/addresses/${ACCOUNT}/balances:listErc20`,
    );
    expect(tokens).toEqual([
      {
        address: USDT,
        symbol: "USDT",
        name: "TetherToken",
        decimals: 6,
        source: "discovered",
        verification: "unverified",
      },
    ]);
  });

  it("returns nothing when the API fails", async () => {
    stubFetch({}, false);
    const { discoverGlacierTokens } = await import("./glacier");

    expect(await discoverGlacierTokens(43114, ACCOUNT)).toEqual([]);
  });
});
