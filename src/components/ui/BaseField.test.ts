// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import BaseInput from "./BaseInput.vue";
import BaseTextarea from "./BaseTextarea.vue";

describe("base field wrappers", () => {
  it("forwards attrs to BaseInput and associates the label", () => {
    const wrapper = mount(BaseInput, {
      props: {
        modelValue: "",
        "onUpdate:modelValue": () => {},
        label: "Recipient",
        error: "Invalid address",
        id: "recipient",
        autocomplete: "off",
        required: true,
      },
    });

    const input = wrapper.get("input");
    expect(input.attributes("id")).toBe("recipient");
    expect(input.attributes("autocomplete")).toBe("off");
    expect(input.attributes("required")).toBe("");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("label").attributes("for")).toBe("recipient");
    expect(input.attributes("aria-describedby")).toBeTruthy();
  });

  it("forwards attrs to BaseTextarea and associates the label", () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        modelValue: "",
        "onUpdate:modelValue": () => {},
        label: "Message",
        error: "Required",
        id: "message",
        rows: 6,
        maxlength: 280,
      },
    });

    const textarea = wrapper.get("textarea");
    expect(textarea.attributes("id")).toBe("message");
    expect(textarea.attributes("rows")).toBe("6");
    expect(textarea.attributes("maxlength")).toBe("280");
    expect(textarea.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("label").attributes("for")).toBe("message");
    expect(textarea.attributes("aria-describedby")).toBeTruthy();
  });
});
