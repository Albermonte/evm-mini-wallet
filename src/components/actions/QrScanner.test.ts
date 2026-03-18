// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("QrScanner", () => {
  async function renderQrScanner(options?: { error?: string | null }) {
    const start = vi.fn();
    const stop = vi.fn();

    vi.doMock("../../composables/useQrScanner", () => ({
      useQrScanner: ({ onScan }: { onScan: (result: string) => void }) => ({
        videoEl: ref<HTMLVideoElement | null>(null),
        start,
        stop,
        error: ref(options?.error ?? null),
        onScan,
      }),
    }));

    const { default: QrScanner } = await import("./QrScanner.vue");
    const wrapper = mount(QrScanner, {
      attachTo: document.body,
      global: {
        stubs: {
          teleport: true,
        },
      },
    });

    return { wrapper, start, stop };
  }

  it("starts scanning on mount", async () => {
    const { start } = await renderQrScanner();

    expect(start).toHaveBeenCalled();
  });

  it("stops scanning and emits close when closed", async () => {
    const { wrapper, stop } = await renderQrScanner();

    await wrapper.get('button[aria-label="Close scanner"]').trigger("click");

    expect(stop).toHaveBeenCalled();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("shows the error overlay", async () => {
    const { wrapper } = await renderQrScanner({
      error: "Camera permission denied",
    });

    expect(document.body.textContent).toContain("Camera permission denied");
    expect(document.body.textContent).toContain("Close");
    wrapper.unmount();
  });
});
