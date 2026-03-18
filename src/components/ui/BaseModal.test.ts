// @vitest-environment jsdom

import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, nextTick, ref } from "vue";
import { describe, expect, it } from "vite-plus/test";
import BaseModal from "./BaseModal.vue";

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

    // Close button exists
    const closeButton = dialog?.querySelector('button[aria-label="Close modal"]');
    expect(closeButton).not.toBeNull();

    wrapper.unmount();
  });

  it("closes dialog when close button is clicked", async () => {
    const wrapper = mount(
      defineComponent({
        components: { BaseModal },
        setup() {
          const open = ref(true);
          return { open };
        },
        template: `
          <BaseModal v-model="open" title="Test">
            <p>Content</p>
          </BaseModal>
        `,
      }),
      { attachTo: document.body },
    );

    await flushPromises();
    await nextTick();

    expect(document.body.querySelector('[role="dialog"][data-state="open"]')).not.toBeNull();

    const closeButton = document.body.querySelector(
      'button[aria-label="Close modal"]',
    ) as HTMLButtonElement;
    closeButton.click();
    await flushPromises();
    await nextTick();

    // Reka UI Dialog sets data-state="closed" when dismissed
    expect(document.body.querySelector('[role="dialog"][data-state="open"]')).toBeNull();

    wrapper.unmount();
  });
});
