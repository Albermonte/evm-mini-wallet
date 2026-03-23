// @vitest-environment jsdom

import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";
import BaseModal from "./BaseModal.vue";

vi.mock("vaul-vue", () => ({
  DrawerRoot: defineComponent({
    props: { open: Boolean },
    setup(props, { slots }) {
      return () => (props.open ? h("div", slots.default?.()) : null);
    },
  }),
  DrawerPortal: defineComponent({
    setup(_props, { slots }) {
      return () => h("div", slots.default?.());
    },
  }),
  DrawerOverlay: defineComponent({
    setup() {
      return () => h("div");
    },
  }),
  DrawerContent: defineComponent({
    setup(_props, { attrs, slots }) {
      return () => h("div", { ...attrs, role: "dialog", "data-state": "open" }, slots.default?.());
    },
  }),
  DrawerTitle: defineComponent({
    setup(_props, { attrs, slots }) {
      return () => h("h2", attrs, slots.default?.());
    },
  }),
  DrawerDescription: defineComponent({
    setup(_props, { attrs, slots }) {
      return () => h("p", attrs, slots.default?.());
    },
  }),
}));

describe("BaseModal", () => {
  it("renders an accessible dialog with proper ARIA attributes", async () => {
    const wrapper = mount(
      defineComponent({
        components: { BaseModal },
        setup() {
          const open = ref(true);
          return { open };
        },
        template: `
          <BaseModal v-model="open" title="Connect Wallet">
            <button>Primary action</button>
          </BaseModal>
        `,
      }),
      { attachTo: document.body },
    );

    await flushPromises();
    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("data-state")).toBe("open");

    // DialogTitle is rendered
    const title = dialog?.querySelector("h2");
    expect(title?.textContent?.trim()).toBe("Connect Wallet");

    wrapper.unmount();
  });

  it("closes dialog when the controlled model is set to false", async () => {
    const wrapper = mount(
      defineComponent({
        components: { BaseModal },
        setup() {
          const open = ref(true);
          return { open };
        },
        template: `
          <div>
            <button data-testid="close-modal" @click="open = false">Close</button>
            <BaseModal v-model="open" title="Test">
              <p>Content</p>
            </BaseModal>
          </div>
        `,
      }),
      { attachTo: document.body },
    );

    await flushPromises();
    await nextTick();

    expect(document.body.querySelector('[role="dialog"][data-state="open"]')).not.toBeNull();

    await wrapper.get('[data-testid="close-modal"]').trigger("click");
    await flushPromises();
    await nextTick();

    expect(document.body.querySelector('[role="dialog"][data-state="open"]')).toBeNull();

    wrapper.unmount();
  });
});
