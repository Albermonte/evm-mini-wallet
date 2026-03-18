// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import BaseCard from "./BaseCard.vue";

describe("BaseCard", () => {
  it("renders the title when provided", () => {
    const wrapper = mount(BaseCard, {
      props: {
        title: "Assets",
      },
    });

    expect(wrapper.text()).toContain("Assets");
  });

  it("renders slot content", () => {
    const wrapper = mount(BaseCard, {
      slots: {
        default: "<p>Body content</p>",
      },
    });

    expect(wrapper.html()).toContain("Body content");
  });
});
