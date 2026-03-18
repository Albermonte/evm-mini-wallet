import { describe, expect, it } from "vite-plus/test";
import { getTokenKey } from "./tokens";

describe("getTokenKey", () => {
  it("uses a native token marker for native assets", () => {
    expect(
      getTokenKey({
        address: null,
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        isNative: true,
      }),
    ).toBe("native:ETH");
  });

  it("uses the token address for ERC-20 assets", () => {
    expect(
      getTokenKey({
        address: "0x1111111111111111111111111111111111111111",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
      }),
    ).toBe("0x1111111111111111111111111111111111111111");
  });
});
