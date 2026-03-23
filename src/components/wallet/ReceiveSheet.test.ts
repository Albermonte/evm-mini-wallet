// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("ReceiveSheet", () => {
  async function renderReceiveSheet() {
    const copy = vi.fn();
    const share = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@wagmi/vue", () => ({
      useConnection: () => ({
        address: ref("0x1111111111111111111111111111111111111111"),
      }),
    }));

    vi.doMock("../../composables/useClipboard", () => ({
      useClipboard: () => ({
        copied: ref(false),
        copy,
      }),
    }));

    vi.stubGlobal("navigator", {
      share,
      clipboard: {
        writeText: vi.fn(),
      },
    });

    vi.doMock("qrcode", () => ({
      toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr"),
    }));

    const { default: ReceiveSheet } = await import("./ReceiveSheet.vue");
    const wrapper = mount(ReceiveSheet);
    await flushPromises();

    return { wrapper, copy, share };
  }

  it("renders the connected address, QR, and receive actions", async () => {
    const { wrapper } = await renderReceiveSheet();
    const buttonLabels = wrapper.findAll("button").map((button) => button.text().trim());

    expect(wrapper.text()).toContain("0x1111111111111111111111111111111111111111");
    expect(wrapper.get('img[alt="Receive address QR"]').attributes("src")).toContain(
      "data:image/png",
    );
    expect(buttonLabels).toEqual(["Copy address"]);
  });

  it("copies the address", async () => {
    const { wrapper, copy, share } = await renderReceiveSheet();

    await wrapper.get('button[data-testid="copy-address"]').trigger("click");

    expect(copy).toHaveBeenCalledWith("0x1111111111111111111111111111111111111111");
    expect(share).not.toHaveBeenCalled();
  });
});
