// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

// Make requestAnimationFrame execute callbacks synchronously so animated values resolve immediately
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  cb(performance.now() + 1000);
  return 0;
});

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
        hasKnownTotal: ref(false),
      }),
    }));

    const { default: BalanceDisplay } = await import("./BalanceDisplay.vue");
    const wrapper = mount(BalanceDisplay);

    expect(wrapper.find(".animate-pulse").exists()).toBe(true);
  });

  it("renders the aggregated fiat balance", async () => {
    vi.doMock("../../composables/usePortfolio", () => ({
      usePortfolio: () => ({
        isLoading: ref(false),
        portfolioTotalFiat: ref(1234.56),
        hasKnownTotal: ref(true),
      }),
    }));

    const { default: BalanceDisplay } = await import("./BalanceDisplay.vue");
    const wrapper = mount(BalanceDisplay);

    expect(wrapper.text()).toContain("$1,234.56");
  });

  it("renders an unavailable state when the portfolio total cannot be priced", async () => {
    vi.doMock("../../composables/usePortfolio", () => ({
      usePortfolio: () => ({
        isLoading: ref(false),
        portfolioTotalFiat: ref(null),
        hasKnownTotal: ref(false),
      }),
    }));

    const { default: BalanceDisplay } = await import("./BalanceDisplay.vue");
    const wrapper = mount(BalanceDisplay);

    expect(wrapper.text()).toContain("Value unavailable");
  });
});
