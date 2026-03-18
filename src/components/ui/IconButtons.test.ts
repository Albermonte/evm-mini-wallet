// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { TooltipProvider } from "reka-ui";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("icon-only controls", () => {
  it("labels the theme toggle button and updates the icon state", async () => {
    const isDark = ref(false);

    vi.doMock("../../composables/useTheme", () => ({
      useTheme: () => ({
        isDark,
        toggle: vi.fn(),
      }),
    }));

    const { default: ThemeToggle } = await import("./ThemeToggle.vue");
    const wrapper = mount(ThemeToggle);

    expect(wrapper.get("button").attributes("aria-label")).toBe("Switch to dark mode");
    expect(wrapper.html()).toContain("moon");

    isDark.value = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.get("button").attributes("aria-label")).toBe("Switch to light mode");
    expect(wrapper.html()).toContain("sun");
  });

  it("labels the account info copy button and triggers copy side effects", async () => {
    const copy = vi.fn();
    const addToast = vi.fn();

    vi.doMock("@wagmi/vue", () => ({
      useConnection: () => ({
        address: ref("0x1111111111111111111111111111111111111111"),
      }),
    }));

    vi.doMock("../../composables/useClipboard", () => ({
      useClipboard: () => ({
        copied: ref(false),
        copy,
      }),
    }));

    vi.doMock("../../composables/useToast", () => ({
      useToast: () => ({
        addToast,
      }),
    }));

    const { default: AccountInfo } = await import("../wallet/AccountInfo.vue");

    const Wrapper = defineComponent({
      components: { TooltipProvider, AccountInfo },
      template: `<TooltipProvider><AccountInfo /></TooltipProvider>`,
    });

    const wrapper = mount(Wrapper);
    const copyButton = wrapper.get('button[aria-label="Copy wallet address"]');

    await copyButton.trigger("click");

    expect(copy).toHaveBeenCalledWith("0x1111111111111111111111111111111111111111");
    expect(addToast).toHaveBeenCalledWith("Address copied", "success");
  });
});
