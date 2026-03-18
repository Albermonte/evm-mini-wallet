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

    const { default: AppHeader } = await import("./AppHeader.vue");
    const wrapper = mount(AppHeader, {
      global: {
        stubs: {
          ThemeToggle: { template: '<div data-testid="theme-toggle" />' },
          ChainSelector: { template: '<div data-testid="chain-selector" />' },
          AccountInfo: { template: '<div data-testid="account-info" />' },
        },
      },
    });

    return wrapper;
  }

  it("always renders the theme toggle", async () => {
    const wrapper = await renderHeader(false);

    expect(wrapper.find('[data-testid="theme-toggle"]').exists()).toBe(true);
  });

  it("renders account and chain details only when connected", async () => {
    const disconnected = await renderHeader(false);
    expect(disconnected.find('[data-testid="account-info"]').exists()).toBe(false);
    expect(disconnected.find('[data-testid="chain-selector"]').exists()).toBe(false);

    const connected = await renderHeader(true);
    expect(connected.find('[data-testid="account-info"]').exists()).toBe(true);
    expect(connected.find('[data-testid="chain-selector"]').exists()).toBe(true);
  });
});
