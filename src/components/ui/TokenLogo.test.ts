// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vite-plus/test";
import TokenLogo from "./TokenLogo.vue";

describe("TokenLogo", () => {
  it("falls back through the provided URLs and keeps the advanced URL when the list is unchanged", async () => {
    const wrapper = mount(TokenLogo, {
      props: {
        urls: ["https://example.com/broken.png", "https://example.com/logo.png"],
        symbol: "USDT0",
      },
    });

    await wrapper.get("img").trigger("error");
    await nextTick();

    expect(wrapper.get("img").attributes("src")).toBe("https://example.com/logo.png");

    await wrapper.setProps({
      urls: ["https://example.com/broken.png", "https://example.com/logo.png"],
    });
    await nextTick();

    expect(wrapper.get("img").attributes("src")).toBe("https://example.com/logo.png");
  });

  it("resets to the first URL when the URL list changes", async () => {
    const wrapper = mount(TokenLogo, {
      props: {
        urls: ["https://example.com/broken.png", "https://example.com/logo.png"],
        symbol: "USDT0",
      },
    });

    await wrapper.get("img").trigger("error");
    await nextTick();
    expect(wrapper.get("img").attributes("src")).toBe("https://example.com/logo.png");

    await wrapper.setProps({
      urls: ["https://example.com/refreshed.png", "https://example.com/logo.png"],
    });
    await nextTick();

    expect(wrapper.get("img").attributes("src")).toBe("https://example.com/refreshed.png");
  });

  it("shows symbol initials after every URL fails", async () => {
    const wrapper = mount(TokenLogo, {
      props: {
        urls: ["https://example.com/broken.png"],
        symbol: "USDT0",
      },
    });

    await wrapper.get("img").trigger("error");
    await nextTick();

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toContain("US");
  });
});
