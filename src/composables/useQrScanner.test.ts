// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useQrScanner } from "./useQrScanner";

const { startMock, stopMock, destroyMock, hasCameraMock } = vi.hoisted(() => ({
  startMock: vi.fn(),
  stopMock: vi.fn(),
  destroyMock: vi.fn(),
  hasCameraMock: vi.fn(),
}));

vi.mock("qr-scanner", () => {
  class QrScannerMock {
    static hasCamera = hasCameraMock;

    start = startMock;
    stop = stopMock;
    destroy = destroyMock;
  }

  return {
    default: QrScannerMock,
  };
});

describe("useQrScanner", () => {
  beforeEach(() => {
    startMock.mockReset();
    stopMock.mockReset();
    destroyMock.mockReset();
    hasCameraMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mountHarness(options?: {
    onScan?: (result: string) => void;
    onError?: (error: Error) => void;
  }) {
    let api!: ReturnType<typeof useQrScanner>;

    const Harness = defineComponent({
      setup() {
        api = useQrScanner({
          onScan: options?.onScan ?? vi.fn(),
          onError: options?.onError,
        });

        return () => null;
      },
    });

    const wrapper = mount(Harness);
    return { wrapper, api };
  }

  it("reports when no camera is available", async () => {
    hasCameraMock.mockResolvedValue(false);

    const { wrapper, api } = mountHarness();

    await api.start();

    expect(api.hasCamera.value).toBe(false);
    expect(api.error.value).toBe("No camera found on this device");
    wrapper.unmount();
  });

  it("reports when the video element is not ready", async () => {
    hasCameraMock.mockResolvedValue(true);

    const { wrapper, api } = mountHarness();

    await api.start();

    expect(api.error.value).toBe("Video element not ready");
    wrapper.unmount();
  });

  it("starts and stops the scanner when a video element exists", async () => {
    hasCameraMock.mockResolvedValue(true);
    startMock.mockResolvedValue(undefined);

    const { wrapper, api } = mountHarness();
    api.videoEl.value = document.createElement("video");

    await api.start();
    await nextTick();

    expect(startMock).toHaveBeenCalled();
    expect(api.isActive.value).toBe(true);

    api.stop();

    expect(stopMock).toHaveBeenCalled();
    expect(destroyMock).toHaveBeenCalled();
    expect(api.isActive.value).toBe(false);
    wrapper.unmount();
  });

  it("maps permission errors and forwards them to the caller", async () => {
    hasCameraMock.mockResolvedValue(true);
    startMock.mockRejectedValue(new DOMException("Permission denied", "NotAllowedError"));

    const onError = vi.fn();
    const { wrapper, api } = mountHarness({ onError });
    api.videoEl.value = document.createElement("video");

    await api.start();

    expect(api.error.value).toBe("Camera permission denied");
    expect(api.hasCamera.value).toBe(true);
    expect(onError).toHaveBeenCalled();
    wrapper.unmount();
  });
});
