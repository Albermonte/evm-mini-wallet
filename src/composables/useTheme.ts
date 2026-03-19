import { computed, shallowRef, watch } from "vue";

const isDark = shallowRef(false);
const logoSrc = computed(() => (isDark.value ? "/favicon-dark.svg" : "/favicon.svg"));
let hasInitialized = false;

function canUseBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function applyTheme(value: boolean) {
  if (!canUseBrowser()) return;
  document.documentElement.classList.toggle("dark", value);
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) favicon.href = value ? "/favicon-dark.svg" : "/favicon.svg";
}

function initTheme() {
  if (!canUseBrowser() || hasInitialized) return;

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  isDark.value = mq.matches;
  applyTheme(isDark.value);

  mq.addEventListener("change", (e) => {
    isDark.value = e.matches;
  });

  watch(isDark, (value) => {
    applyTheme(value);
  });

  hasInitialized = true;
}

export function useTheme() {
  initTheme();
  return { isDark, logoSrc };
}
