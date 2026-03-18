import { beforeEach, describe, expect, it } from "vite-plus/test";
import { useToast } from "./useToast";

describe("useToast", () => {
  beforeEach(() => {
    const { toasts, removeToast } = useToast();
    while (toasts.value.length > 0) {
      removeToast(toasts.value[0]!.id);
    }
  });

  it("adds toasts with default type and duration", () => {
    const { toasts, addToast } = useToast();

    addToast("Saved");

    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]).toMatchObject({
      message: "Saved",
      type: "info",
      duration: 4000,
    });
  });

  it("removes toasts by id and keeps incrementing ids", () => {
    const { toasts, addToast, removeToast } = useToast();

    addToast("First", "success", 1000);
    addToast("Second", "error", 2000);

    const [first, second] = toasts.value;
    removeToast(first!.id);

    expect(toasts.value).toEqual([second]);

    addToast("Third");
    expect(toasts.value[1]!.id).toBeGreaterThan(second!.id);
  });
});
