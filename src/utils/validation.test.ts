import { describe, expect, it } from "vite-plus/test";
import { isUserRejection } from "./validation";

describe("isUserRejection", () => {
  it("treats provider rejection codes as user rejection", () => {
    expect(isUserRejection({ message: "Execution reverted", code: 4001 })).toBe(true);
    expect(
      isUserRejection({ message: "Execution reverted", cause: { code: "ACTION_REJECTED" } }),
    ).toBe(true);
  });
});
