import { describe, expect, it } from "vite-plus/test";
import { calculateMaxSendable, resolveTransactionChainId } from "./transactions";

describe("calculateMaxSendable", () => {
  it("subtracts the estimated gas cost from the current balance", () => {
    expect(calculateMaxSendable(1_000_000n, 21_000n, 10n)).toBe(790_000n);
  });

  it("returns null when the balance cannot cover gas", () => {
    expect(calculateMaxSendable(210_000n, 21_000n, 10n)).toBeNull();
  });
});

describe("resolveTransactionChainId", () => {
  it("prefers the submitted chain over the current active chain", () => {
    expect(resolveTransactionChainId(8453, 1)).toBe(8453);
  });
});
