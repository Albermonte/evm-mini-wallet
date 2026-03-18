import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_CHAIN_COLOR,
  chainMeta,
  getChainColor,
  getChainLogo,
  getExplorerTxUrl,
  supportedChains,
} from "./chains";

describe("chains helpers", () => {
  it("returns configured metadata for supported chains", () => {
    expect(getChainColor(8453)).toBe(chainMeta[8453]!.color);
    expect(getChainLogo(8453)).toBe(chainMeta[8453]!.logo);
    expect(getExplorerTxUrl(8453, "0xhash")).toBe("https://basescan.org/tx/0xhash");
  });

  it("falls back for unknown chains", () => {
    expect(getChainColor(999999)).toBe(DEFAULT_CHAIN_COLOR);
    expect(getChainLogo(999999)).toBeUndefined();
    expect(getExplorerTxUrl(999999, "0xhash")).toBe("");
  });

  it("exports supported chains as a non-empty list", () => {
    expect(supportedChains.length).toBeGreaterThan(0);
    expect(supportedChains.map((chain) => chain.id)).toContain(8453);
  });
});
