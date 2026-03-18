import { describe, expect, it } from "vite-plus/test";
import { getChainLogoUrl, getNativeTokenLogoUrls, getTokenLogoUrls } from "./token-logos";

describe("token logo helpers", () => {
  it("returns trust wallet chain logos for supported chains", () => {
    expect(getChainLogoUrl(8453)).toContain("/blockchains/base/info/logo.png");
    expect(getChainLogoUrl(999999)).toBeUndefined();
  });

  it("wraps native token logos in an array", () => {
    expect(getNativeTokenLogoUrls(8453)).toEqual([
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
    ]);
    expect(getNativeTokenLogoUrls(999999)).toEqual([]);
  });

  it("builds token logo URLs with checksum addresses and multiple providers", () => {
    const urls = getTokenLogoUrls(8453, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(urls[1]).toContain("/8453/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/");
  });
});
