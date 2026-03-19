import { ref, onMounted, onUnmounted, type Ref } from "vue";

export interface PullToRefreshOptions {
  /** Element that scrolls. Pull only activates when scrollTop ≈ 0. */
  scrollTarget: Ref<HTMLElement | null>;
  /** Called when the user completes a pull. Must return a promise. */
  onRefresh: () => Promise<void>;
  /** Distance in px the user must pull to trigger a refresh. Default 80. */
  threshold?: number;
  /** Max pull distance in px. Default 120. */
  maxPull?: number;
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const { scrollTarget, onRefresh, threshold = 80, maxPull = 120 } = options;

  const pullDistance = ref(0);
  const isRefreshing = ref(false);
  const isPulling = ref(false);

  let startY = 0;
  let tracking = false;

  function onTouchStart(e: TouchEvent) {
    if (isRefreshing.value) return;
    const el = scrollTarget.value;
    if (!el || el.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    tracking = true;
    isPulling.value = false;
  }

  function onTouchMove(e: TouchEvent) {
    if (!tracking || isRefreshing.value) return;
    const el = scrollTarget.value;
    if (!el) return;

    // If user scrolled down since touch started, abort tracking
    if (el.scrollTop > 0) {
      tracking = false;
      pullDistance.value = 0;
      isPulling.value = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;
    if (delta <= 0) {
      pullDistance.value = 0;
      isPulling.value = false;
      return;
    }

    // Prevent native scroll while pulling
    e.preventDefault();
    isPulling.value = true;

    // Rubber-band effect: diminishing returns past threshold
    const ratio = Math.min(delta / maxPull, 1);
    pullDistance.value = ratio * maxPull * (1 - ratio * 0.3);
  }

  async function onTouchEnd() {
    if (!tracking) return;
    tracking = false;

    if (pullDistance.value >= threshold && !isRefreshing.value) {
      isRefreshing.value = true;
      pullDistance.value = threshold * 0.5; // Hold at a compact position while refreshing
      try {
        await onRefresh();
      } finally {
        isRefreshing.value = false;
        pullDistance.value = 0;
      }
    } else {
      pullDistance.value = 0;
    }
    isPulling.value = false;
  }

  onMounted(() => {
    const el = scrollTarget.value;
    if (!el) return;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
  });

  onUnmounted(() => {
    const el = scrollTarget.value;
    if (!el) return;
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
  });

  return {
    /** Current pull distance in px. */
    pullDistance,
    /** Whether user is actively pulling. */
    isPulling,
    /** Whether refresh callback is running. */
    isRefreshing,
    /** Progress toward trigger threshold, 0–1. */
    get pullProgress() {
      return Math.min(pullDistance.value / threshold, 1);
    },
  };
}
