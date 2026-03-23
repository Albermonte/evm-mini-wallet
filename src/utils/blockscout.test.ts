import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const ACCOUNT = "0x1111111111111111111111111111111111111111";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
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
