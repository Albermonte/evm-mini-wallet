// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("AppHeader", () => {
  async function renderHeader(isConnected: boolean) {
    vi.resetModules();

    vi.doMock("@wagmi/vue", () => ({
      useConnection: () => ({
        isConnected: ref(isConnected),
      }),
    }));

    vi.doMock("../../composables/useTheme", () => ({
      useTheme: () => ({
        isDark: ref(false),
        logoSrc: ref("/favicon.svg"),
      }),
    }));

    const { default: AppHeader } = await import("./AppHeader.vue");
    const wrapper = mount(AppHeader, {
      global: {
        stubs: {
          AccountInfo: { template: '<div data-testid="account-info" />' },
          ChainSelector: { template: '<div data-testid="chain-selector" />' },
        },
      },
    });

    return wrapper;
  }

  it("shows wordmark when disconnected, chain selector when connected", async () => {
    const disconnected = await renderHeader(false);
    expect(disconnected.text()).toContain("Mini Wallet");
    expect(disconnected.find('[data-testid="chain-selector"]').exists()).toBe(false);

    const connected = await renderHeader(true);
    expect(connected.text()).not.toContain("Mini Wallet");
    expect(connected.find('[data-testid="chain-selector"]').exists()).toBe(true);
  });

  it("renders account info only when connected", async () => {
    const disconnected = await renderHeader(false);
    expect(disconnected.find('[data-testid="account-info"]').exists()).toBe(false);

    const connected = await renderHeader(true);
    expect(connected.find('[data-testid="account-info"]').exists()).toBe(true);
  });
});
