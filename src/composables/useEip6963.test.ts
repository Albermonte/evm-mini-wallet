// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { useEip6963Providers } from "./useEip6963";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEip6963Providers", () => {
  it("requests providers on mount and collects unique announcements", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    const Harness = defineComponent({
      setup() {
        const { providers } = useEip6963Providers();
        return () => h("div", providers.value.map((provider) => provider.info.name).join(","));
      },
    });

    const wrapper = mount(Harness);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "eip6963:requestProvider" }),
    );

    const detail = {
      info: {
        uuid: "wallet-1",
        name: "Alpha Wallet",
        icon: "icon.png",
        rdns: "com.alpha.wallet",
      },
      provider: {} as never,
    };

    window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail }));
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Alpha Wallet");

    window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail }));
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe("Alpha Wallet");

    wrapper.unmount();
  });

  it("removes the announce listener on unmount", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const Harness = defineComponent({
      setup() {
        useEip6963Providers();
        return () => h("div");
      },
    });

    const wrapper = mount(Harness);
    wrapper.unmount();

    expect(removeSpy).toHaveBeenCalledWith("eip6963:announceProvider", expect.any(Function));
  });
});
