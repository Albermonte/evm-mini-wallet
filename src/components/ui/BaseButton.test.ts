// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import BaseButton from "./BaseButton.vue";

describe("BaseButton", () => {
  it("defaults to a safe button type", () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: "Submit",
      },
    });

    expect(wrapper.get("button").attributes("type")).toBe("button");
  });
});
