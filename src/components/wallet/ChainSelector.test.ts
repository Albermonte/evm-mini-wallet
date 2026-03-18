// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("ChainSelector", () => {
  async function renderChainSelector(options?: { switchError?: Error; currentChainId?: number }) {
    const chainId = ref(options?.currentChainId ?? 8453);
    const addToast = vi.fn();

    vi.doMock("@wagmi/vue", () => ({
      useChainId: () => chainId,
      useSwitchChain: () => ({
        chains: [
          { id: 8453, name: "Base" },
          { id: 1, name: "Ethereum" },
        ],
        switchChain: (
          { chainId: nextChainId }: { chainId: number },
          callbacks?: { onSuccess?: () => void; onError?: (error: Error) => void },
        ) => {
          if (options?.switchError) {
            callbacks?.onError?.(options.switchError);
            return;
          }
          chainId.value = nextChainId;
          callbacks?.onSuccess?.();
        },
      }),
    }));

    vi.doMock("../../composables/useToast", () => ({
      useToast: () => ({ addToast }),
    }));

    vi.doMock("reka-ui", () => ({
      PopoverRoot: defineComponent({
        props: { open: Boolean },
        emits: ["update:open"],
        setup(_props, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      PopoverTrigger: defineComponent({
        setup(_props, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      PopoverPortal: defineComponent({
        setup(_props, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      PopoverContent: defineComponent({
        setup(_props, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
    }));

    const { default: ChainSelector } = await import("./ChainSelector.vue");
    const wrapper = mount(ChainSelector);

    return { wrapper, addToast };
  }

  it("renders the current chain label", async () => {
    const { wrapper } = await renderChainSelector();

    expect(wrapper.text()).toContain("Base");
  });

  it("switches chains successfully", async () => {
    const { wrapper } = await renderChainSelector();

    const buttons = wrapper.findAll("button");
    await buttons[2]!.trigger("click");

    expect(wrapper.text()).toContain("Ethereum");
  });

  it("shows a toast when switching fails", async () => {
    const { wrapper, addToast } = await renderChainSelector({
      switchError: new Error("User rejected"),
    });

    const buttons = wrapper.findAll("button");
    await buttons[2]!.trigger("click");

    expect(addToast).toHaveBeenCalledWith("User rejected", "error");
  });
});
