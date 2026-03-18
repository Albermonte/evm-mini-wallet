import { describe, expect, it, vi } from "vite-plus/test";

describe("useTheme", () => {
  it("can be imported without browser globals", async () => {
    vi.resetModules();

    await expect(import("./useTheme")).resolves.toMatchObject({
      useTheme: expect.any(Function),
    });
  });
});
