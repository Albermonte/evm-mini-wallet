import { ref, onBeforeUnmount, type Ref } from "vue";
import QrScanner from "qr-scanner";

export function useQrScanner(options: {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
}) {
  const videoEl: Ref<HTMLVideoElement | null> = ref(null);
  const isActive = ref(false);
  const hasCamera = ref(true);
  const error: Ref<string | null> = ref(null);

  let scanner: QrScanner | null = null;

  async function start() {
    error.value = null;

    const cameraAvailable = await QrScanner.hasCamera();
    if (!cameraAvailable) {
      hasCamera.value = false;
      error.value = "No camera found on this device";
      return;
    }

    if (!videoEl.value) {
      error.value = "Video element not ready";
      return;
    }

    try {
      scanner = new QrScanner(
        videoEl.value,
        (result) => {
          options.onScan(result.data);
        },
        {
          onDecodeError: () => {
            // Silently ignore decode errors (no QR in frame)
          },
          preferredCamera: "environment",
          highlightScanRegion: false,
          highlightCodeOutline: false,
          returnDetailedScanResult: true,
        },
      );

      await scanner.start();
      isActive.value = true;
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied"
          : ((err as Error).message ?? "Unable to access camera");
      error.value = message;
      hasCamera.value = err instanceof DOMException && err.name === "NotAllowedError";
      options.onError?.(err as Error);
    }
  }

  function stop() {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
      scanner = null;
    }
    isActive.value = false;
  }

  onBeforeUnmount(stop);

  return { videoEl, start, stop, isActive, hasCamera, error };
}
