// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { Address } from "viem";
import { getTokenKey } from "../../utils/tokens";

const TOKEN_ADDRESS = "0x2222222222222222222222222222222222222222" as Address;
const NATIVE_KEY = "native:ETH";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function renderTokenList(options?: { tokens?: any[]; trustedTokenKeys?: Set<string> }) {
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
      },
    ],
  );
  const trustedTokenKeys = ref(options?.trustedTokenKeys ?? new Set([NATIVE_KEY]));
  const scopeKey = ref("137:0x1111111111111111111111111111111111111111");
  const markTokenTrusted = vi.fn((tokenKey: string) => {
    trustedTokenKeys.value.add(tokenKey);
    trustedTokenKeys.value = new Set(trustedTokenKeys.value);
  });

  vi.doMock("../../composables/usePortfolio", () => ({
    usePortfolio: () => ({
      tokens,
      isLoading: ref(false),
      trustedTokenKeys,
      markTokenTrusted,
      scopeKey,
    }),
  }));

  const { default: TokenList } = await import("./TokenList.vue");
  const wrapper = mount(TokenList, {
    global: {
      stubs: {
        TokenLogo: {
          template: '<button data-testid="token-logo" @click="$emit(\'logo-loaded\')" />',
        },
      },
    },
  });

  return {
    wrapper,
    markTokenTrusted,
    scopeKey,
    tokens,
    trustedTokenKeys,
  };
}

describe("TokenList", () => {
  it("shows trusted tokens immediately and keeps untrusted tokens behind the expand affordance", async () => {
    const { wrapper } = await renderTokenList();

    expect(wrapper.text()).toContain("Show 1 more token");
    expect(wrapper.text()).toContain("ETH");
    expect(wrapper.text()).toContain("USDT0");
  });

  it("shows an empty state when no tokens are returned", async () => {
    const { wrapper } = await renderTokenList({ tokens: [] });

    expect(wrapper.text()).toContain("No tokens yet");
  });

  it("marks a token as trusted when its logo loads", async () => {
    const { wrapper, markTokenTrusted } = await renderTokenList();

    await wrapper.findAll('[data-testid="token-logo"]')[1]!.trigger("click");
    await nextTick();

    expect(markTokenTrusted).toHaveBeenCalledWith(
      getTokenKey({
        address: TOKEN_ADDRESS,
        symbol: "USDT0",
        name: "USDT0",
        decimals: 6,
      }),
    );
  });

  it("resets the expansion state when the portfolio scope changes", async () => {
    const { wrapper, scopeKey } = await renderTokenList();

    await wrapper.findAll("button").at(-1)!.trigger("click");
    await nextTick();
    expect(wrapper.text()).toContain("Show less");

    scopeKey.value = "8453:0x1111111111111111111111111111111111111111";
    await nextTick();

    expect(wrapper.text()).toContain("Show 1 more token");
  });
});
