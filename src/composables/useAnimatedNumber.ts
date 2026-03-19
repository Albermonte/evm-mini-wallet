import { ref, watch, onUnmounted, toValue, type MaybeRefOrGetter } from "vue";

export function useAnimatedNumber(
  source: MaybeRefOrGetter<number | null>,
  options: { duration?: number } = {},
) {
  const { duration = 900 } = options;
  const displayValue = ref(0);
  let frameId: number | null = null;

  function cancel() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  watch(
    () => toValue(source),
    (newVal) => {
      if (newVal === null) return;
      cancel();

      const start = displayValue.value;
      const end = newVal;
      if (start === end) return;

      const startTime = performance.now();

      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out-quart — smooth deceleration
        const eased = 1 - (1 - progress) ** 4;
        displayValue.value = start + (end - start) * eased;

        if (progress < 1) {
          frameId = requestAnimationFrame(step);
        } else {
          frameId = null;
        }
      }

      frameId = requestAnimationFrame(step);
    },
    { immediate: true },
  );

  onUnmounted(cancel);

  return displayValue;
}
