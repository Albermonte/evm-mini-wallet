// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, ref } from "vue";
import { TooltipProvider } from "reka-ui";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("icon-only controls", () => {
  it("labels the theme toggle button", async () => {
    vi.doMock("../../composables/useTheme", () => ({
      useTheme: () => ({
        isDark: ref(false),
        toggle: vi.fn(),
      }),
    }));

    const { default: ThemeToggle } = await import("./ThemeToggle.vue");
    const wrapper = mount(ThemeToggle);

    expect(wrapper.get("button").attributes("aria-label")).toBe("Switch to dark mode");
  });

  it("labels the account info copy button", async () => {
    vi.doMock("@wagmi/vue", () => ({
      useConnection: () => ({
        address: ref("0x1111111111111111111111111111111111111111"),
      }),
    }));

    vi.doMock("../../composables/useClipboard", () => ({
      useClipboard: () => ({
        copied: ref(false),
        copy: vi.fn(),
      }),
    }));

    vi.doMock("../../composables/useToast", () => ({
      useToast: () => ({
        addToast: vi.fn(),
      }),
    }));

    const { default: AccountInfo } = await import("../wallet/AccountInfo.vue");

    const Wrapper = defineComponent({
      components: { TooltipProvider, AccountInfo },
      template: `<TooltipProvider><AccountInfo /></TooltipProvider>`,
    });

    const wrapper = mount(Wrapper);
    const copyButton = wrapper.find('button[aria-label="Copy wallet address"]');
    expect(copyButton.exists()).toBe(true);
  });
});
