// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { ToastProvider } from "reka-ui";
import { useToast } from "../../composables/useToast";
import Toast from "./Toast.vue";

const ToastWrapper = defineComponent({
  components: { ToastProvider, Toast },
  template: `<ToastProvider><Toast /></ToastProvider>`,
});

afterEach(() => {
  const { toasts, removeToast } = useToast();
  for (const toast of toasts.value) {
    removeToast(toast.id);
  }
});

describe("Toast", () => {
  it("renders toast with message and close button", async () => {
    const wrapper = mount(ToastWrapper, { attachTo: document.body });
    const { addToast } = useToast();

    addToast("Transaction failed", "error", 10000);
    await nextTick();
    await nextTick();

    // Reka UI Toast renders toasts in the viewport
    const toastElement = document.body.querySelector("[data-state='open']");
    expect(toastElement?.textContent).toContain("Transaction failed");

    const closeButton = toastElement?.querySelector('button[aria-label="Dismiss notification"]');
    expect(closeButton).not.toBeNull();

    wrapper.unmount();
  });
});
