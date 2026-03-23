// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { Address } from "viem";

const TOKEN_ADDRESS = "0x2222222222222222222222222222222222222222" as Address;
const EXTRA_TOKEN_ADDRESS = "0x3333333333333333333333333333333333333333" as Address;
const FOURTH_TOKEN_ADDRESS = "0x4444444444444444444444444444444444444444" as Address;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

async function renderTokenList(options?: {
  tokens?: any[];
  status?: "success" | "error";
  loadableLogos?: string[];
}) {
  const tokens = ref(
    options?.tokens ?? [
      {
        token: {
          address: null,
          symbol: "ETH",
          name: "Ether",
          decimals: 18,
          isNative: true,
        },
        balance: 1_000_000_000_000_000_000n,
        logoUrls: ["https://example.com/eth.png"],
        fiatValue: null,
      },
      {
        token: {
          address: TOKEN_ADDRESS,
          symbol: "USDT0",
          name: "USDT0",
          decimals: 6,
        },
        balance: 1230000n,
        logoUrls: ["https://example.com/usdt0.png"],
        fiatValue: null,
      },
      {
        token: {
          address: EXTRA_TOKEN_ADDRESS,
          symbol: "DAI",
          name: "Dai",
          decimals: 18,
        },
        balance: 1000000000000000000n,
        logoUrls: ["https://example.com/dai.png"],
        fiatValue: null,
      },
      {
        token: {
          address: FOURTH_TOKEN_ADDRESS,
          symbol: "WBTC",
          name: "Wrapped Bitcoin",
          decimals: 8,
        },
        balance: 100000000n,
        logoUrls: ["https://example.com/wbtc.png"],
        fiatValue: null,
      },
    ],
  );
  const scopeKey = ref("137:0x1111111111111111111111111111111111111111");
  const refetch = vi.fn();

  vi.doMock("../../composables/usePortfolio", () => ({
    usePortfolio: () => ({
      tokens,
      isLoading: ref(false),
      status: ref(options?.status ?? "success"),
      error: ref(options?.status === "error" ? new Error("Could not load tokens") : null),
      scopeKey,
      refetch,
    }),
  }));

  const loadableLogos = new Set(
    options?.loadableLogos ?? [
      "https://example.com/eth.png",
      "https://example.com/usdt0.png",
      "https://example.com/dai.png",
      "https://example.com/wbtc.png",
    ],
  );

  class MockImage {
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;

    set src(value: string) {
      queueMicrotask(() => {
        if (loadableLogos.has(value)) {
          this.onload?.();
          return;
        }

        this.onerror?.();
      });
    }
  }

  vi.stubGlobal("Image", MockImage);

  const { default: TokenList } = await import("./TokenList.vue");
  const wrapper = mount(TokenList);
  await flushPromises();
  await nextTick();

  return {
    wrapper,
    refetch,
    scopeKey,
    tokens,
  };
}

describe("TokenList", () => {
  it("shows tokens with resolved logos and keeps the remainder behind the expand affordance", async () => {
    const { wrapper } = await renderTokenList();

    expect(wrapper.text()).toContain("ETH");
    expect(wrapper.text()).toContain("USDT0");
    expect(wrapper.text()).toContain("DAI");
    expect(wrapper.text()).toContain("Show 1 more token");
    expect(wrapper.text()).not.toContain("WBTC");

    await wrapper.get("button").trigger("click");
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("Show less");
    expect(wrapper.text()).toContain("WBTC");
  });

  it("keeps tokens whose logos fail to load hidden", async () => {
    const { wrapper } = await renderTokenList({
      tokens: [
        {
          token: {
            address: null,
            symbol: "ETH",
            name: "Ether",
            decimals: 18,
            isNative: true,
          },
          balance: 1_000_000_000_000_000_000n,
          logoUrls: ["https://example.com/eth.png"],
          fiatValue: null,
        },
        {
          token: {
            address: TOKEN_ADDRESS,
            symbol: "GHOST",
            name: "Ghost",
            decimals: 18,
          },
          balance: 1_000_000_000_000_000_000n,
          logoUrls: ["https://example.com/ghost.png"],
          fiatValue: null,
        },
      ],
      loadableLogos: ["https://example.com/eth.png"],
    });

    expect(wrapper.text()).toContain("ETH");
    expect(wrapper.text()).not.toContain("GHOST");
    expect(wrapper.text()).toContain("Show 1 more token");

    await wrapper.get("button").trigger("click");
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("GHOST");
    expect(wrapper.text()).toContain("Show less");
  });

  it("keeps the expand affordance when hidden tokens fail logo validation", async () => {
    const { wrapper } = await renderTokenList({
      tokens: [
        {
          token: {
            address: null,
            symbol: "ETH",
            name: "Ether",
            decimals: 18,
            isNative: true,
          },
          balance: 1_000_000_000_000_000_000n,
          logoUrls: ["https://example.com/eth.png"],
          fiatValue: null,
        },
        {
          token: {
            address: TOKEN_ADDRESS,
            symbol: "USDT0",
            name: "USDT0",
            decimals: 6,
          },
          balance: 1230000n,
          logoUrls: ["https://example.com/usdt0.png"],
          fiatValue: null,
        },
        {
          token: {
            address: EXTRA_TOKEN_ADDRESS,
            symbol: "DAI",
            name: "Dai",
            decimals: 18,
          },
          balance: 1000000000000000000n,
          logoUrls: ["https://example.com/dai.png"],
          fiatValue: null,
        },
        {
          token: {
            address: FOURTH_TOKEN_ADDRESS,
            symbol: "WBTC",
            name: "Wrapped Bitcoin",
            decimals: 8,
          },
          balance: 100000000n,
          logoUrls: ["https://example.com/wbtc.png"],
          fiatValue: null,
        },
      ],
      loadableLogos: [
        "https://example.com/eth.png",
        "https://example.com/usdt0.png",
        "https://example.com/dai.png",
      ],
    });

    expect(wrapper.text()).toContain("ETH");
    expect(wrapper.text()).toContain("USDT0");
    expect(wrapper.text()).toContain("DAI");
    expect(wrapper.text()).not.toContain("WBTC");
    expect(wrapper.text()).toContain("Show 1 more token");

    await wrapper.get("button").trigger("click");
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("WBTC");
  });

  it("shows an empty state when no tokens are returned", async () => {
    const { wrapper } = await renderTokenList({ tokens: [] });

    expect(wrapper.text()).toContain("No tokens yet");
  });

  it("shows a retry state when the portfolio query fails", async () => {
    const { wrapper, refetch } = await renderTokenList({ status: "error" });

    expect(wrapper.text()).toContain("Could not load tokens");
    await wrapper.get("button").trigger("click");
    await nextTick();

    expect(refetch).toHaveBeenCalled();
  });

  it("resets the expansion state when the portfolio scope changes", async () => {
    const { wrapper, scopeKey } = await renderTokenList();

    await wrapper.findAll("button").at(-1)!.trigger("click");
    await flushPromises();
    await nextTick();
    expect(wrapper.text()).toContain("Show less");

    scopeKey.value = "8453:0x1111111111111111111111111111111111111111";
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("Show 1 more token");
    expect(wrapper.text()).not.toContain("Show less");
  });
});
