// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("SettingsButton", () => {
  it("anchors itself with safe-area-aware viewport offsets", async () => {
    vi.doMock("reka-ui", () => ({
      PopoverRoot: defineComponent({
        setup(_p, { slots }) {
          return () => slots.default?.();
        },
      }),
      PopoverTrigger: defineComponent({
        setup(_p, { slots }) {
          return () => slots.default?.();
        },
      }),
      PopoverPortal: defineComponent({
        setup(_p, { slots }) {
          return () => slots.default?.();
        },
      }),
      PopoverContent: defineComponent({
        setup(_p, { slots }) {
          return () => slots.default?.();
        },
      }),
    }));

    vi.doMock("../../composables/useTheme", () => ({
      useTheme: () => ({
        mode: ref("system"),
        setMode: vi.fn(),
      }),
    }));

    const { default: SettingsButton } = await import("./SettingsButton.vue");
    const wrapper = mount(SettingsButton);
    const dock = wrapper.get('[data-testid="settings-dock"]');

    expect(dock.attributes("style")).toContain(
      "bottom: calc(1.25rem + env(safe-area-inset-bottom))",
    );
    expect(dock.attributes("style")).toContain("right: calc(1.25rem + env(safe-area-inset-right))");
  });
});
