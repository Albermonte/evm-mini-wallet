import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const ACCOUNT = "0x1111111111111111111111111111111111111111";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("fetchTokenBalances RPC configuration", () => {
  it("uses the configured Ethereum RPC fallback instead of the rate-limited default", async () => {
    const getBalance = vi.fn().mockResolvedValue(0n);
    const http = vi.fn((url?: string) => ({ type: "http", url }));
    const fallback = vi.fn((transports: unknown[]) => ({ type: "fallback", transports }));

    vi.doMock("./well-known-tokens", () => ({ wellKnownTokens: {} }));
    vi.doMock("viem", async () => {
      const actual = await vi.importActual<typeof import("viem")>("viem");
      return {
        ...actual,
        createPublicClient: vi.fn(() => ({ getBalance, multicall: vi.fn() })),
        fallback,
        http,
      };
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { fetchTokenBalances } = await import("./token-balances");
    await fetchTokenBalances(1, ACCOUNT);

    expect(http).toHaveBeenCalledWith("https://ethereum-rpc.publicnode.com");
    expect(http).toHaveBeenCalledWith("https://eth.llamarpc.com");
    expect(http).toHaveBeenCalledWith("https://1rpc.io/eth");
    expect(http).toHaveBeenCalledWith("https://rpc.flashbots.net");
    expect(http).not.toHaveBeenCalledWith("https://eth.merkle.io");
    expect(fallback).toHaveBeenCalled();
  });
});
