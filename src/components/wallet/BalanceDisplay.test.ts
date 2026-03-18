// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("BalanceDisplay", () => {
  it("shows a loading skeleton while the portfolio is pending", async () => {
    vi.doMock("../../composables/usePortfolio", () => ({
      usePortfolio: () => ({
        isLoading: ref(true),
        portfolioTotalFiat: ref(null),
      }),
    }));

    const { default: BalanceDisplay } = await import("./BalanceDisplay.vue");
    const wrapper = mount(BalanceDisplay);

    expect(wrapper.find(".animate-pulse").exists()).toBe(true);
  });

  it("renders the aggregated fiat balance and usd badge", async () => {
    vi.doMock("../../composables/usePortfolio", () => ({
      usePortfolio: () => ({
        isLoading: ref(false),
        portfolioTotalFiat: ref(1234.56),
      }),
    }));

    const { default: BalanceDisplay } = await import("./BalanceDisplay.vue");
    const wrapper = mount(BalanceDisplay);

    expect(wrapper.text()).toContain("$1,234.56");
    expect(wrapper.text()).toContain("USD");
  });

  it("renders an empty fallback when no priced portfolio total is available", async () => {
    vi.doMock("../../composables/usePortfolio", () => ({
      usePortfolio: () => ({
        isLoading: ref(false),
        portfolioTotalFiat: ref(null),
      }),
    }));

    const { default: BalanceDisplay } = await import("./BalanceDisplay.vue");
    const wrapper = mount(BalanceDisplay);

    expect(wrapper.text()).toContain("--");
  });
});
