import { describe, expect, it } from "vite-plus/test";
import { formatBalance, truncateAddress } from "./format";

describe("formatBalance", () => {
  it("formats integer balances without a decimal suffix", () => {
    expect(formatBalance(5_000_000_000_000_000_000n)).toBe("5");
  });

  it("truncates decimals to the requested precision", () => {
    expect(formatBalance(1_234_567n, 6, 2)).toBe("1.23");
  });

  it("uses the default max decimal precision", () => {
    expect(formatBalance(1_234_567_890_000_000_000n)).toBe("1.2345");
  });
});

describe("truncateAddress", () => {
  it("keeps short strings intact", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });

  it("shortens long addresses", () => {
    expect(truncateAddress("0x1111111111111111111111111111111111111111")).toBe(
      "0x11111111...1111111111",
    );
  });
});
