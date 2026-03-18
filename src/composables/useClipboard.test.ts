// @vitest-environment jsdom

import { effectScope, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

describe("useClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("marks copied on success and resets after the timeout", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });

    const { useClipboard } = await import("./useClipboard");
    const scope = effectScope();
    const api = scope.run(() => useClipboard())!;

    await api.copy("wallet");
    expect(writeText).toHaveBeenCalledWith("wallet");
    expect(api.copied.value).toBe(true);

    vi.advanceTimersByTime(2000);
    await nextTick();

    expect(api.copied.value).toBe(false);
    scope.stop();
  });

  it("clears the previous timer when copying twice", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });

    const { useClipboard } = await import("./useClipboard");
    const scope = effectScope();
    const api = scope.run(() => useClipboard())!;

    await api.copy("first");
    vi.advanceTimersByTime(1500);
    await api.copy("second");
    vi.advanceTimersByTime(499);
    expect(api.copied.value).toBe(true);

    vi.advanceTimersByTime(1501);
    await nextTick();
    expect(api.copied.value).toBe(false);
    scope.stop();
  });

  it("leaves copied false when clipboard access fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    const { useClipboard } = await import("./useClipboard");
    const scope = effectScope();
    const api = scope.run(() => useClipboard())!;

    await api.copy("wallet");

    expect(api.copied.value).toBe(false);
    scope.stop();
  });
});
