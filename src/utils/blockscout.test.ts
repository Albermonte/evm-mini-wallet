import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const ACCOUNT = "0x1111111111111111111111111111111111111111";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

function mockFetch(responses: Record<"transactions" | "token-transfers", unknown>) {
  return vi.fn().mockImplementation(async (url: string) => {
    const endpoint = url.includes("/token-transfers") ? "token-transfers" : "transactions";
    return {
      ok: true,
      json: async () => responses[endpoint],
    };
  });
}

describe("fetchBlockscoutTransactions", () => {
  it("maps blockscout transactions into the local transaction shape", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        transactions: {
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
        },
        "token-transfers": { items: [], next_page_params: null },
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

  it("merges token transfers and sorts by timestamp desc", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        transactions: {
          items: [
            {
              hash: "0xnative",
              from: { hash: ACCOUNT, name: null, is_contract: false, metadata: null },
              to: { hash: "0xpeer", name: null, is_contract: false, metadata: null },
              value: "1000",
              status: "ok",
              timestamp: "2026-03-18T10:00:00Z",
              method: null,
              fee: { value: "5" },
              transaction_types: ["coin_transfer"],
            },
          ],
          next_page_params: null,
        },
        "token-transfers": {
          items: [
            {
              tx_hash: "0xtoken",
              from: { hash: "0xsender", name: null, is_contract: false, metadata: null },
              to: { hash: ACCOUNT, name: null, is_contract: false, metadata: null },
              total: { value: "5000000", decimals: "6" },
              token: {
                address: "0xusdc",
                name: "USD Coin",
                symbol: "USDC",
                decimals: "6",
                type: "ERC-20",
              },
              timestamp: "2026-03-18T12:00:00Z",
              log_index: 42,
              method: "transfer",
            },
          ],
          next_page_params: null,
        },
      }),
    );

    const { fetchBlockscoutTransactions } = await import("./blockscout");
    const result = await fetchBlockscoutTransactions(8453, ACCOUNT);

    expect(result.map((tx) => tx.hash)).toEqual(["0xtoken", "0xnative"]);
    expect(result[0]?.tokenTransfer).toEqual({
      contract: "0xusdc",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      amount: "5000000",
      type: "ERC-20",
    });
    expect(result[0]?.logIndex).toBe(42);
    expect(result[1]?.tokenTransfer).toBeUndefined();
  });

  it("throws a load error when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const { fetchBlockscoutTransactions } = await import("./blockscout");
    await expect(fetchBlockscoutTransactions(8453, ACCOUNT)).rejects.toThrow(
      "Could not load activity",
    );
  });
});
