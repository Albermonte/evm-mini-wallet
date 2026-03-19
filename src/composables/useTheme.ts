import { computed, shallowRef, watch } from "vue";

export type ThemeMode = "system" | "light" | "dark";

const isDark = shallowRef(false);
const mode = shallowRef<ThemeMode>("system");
const logoSrc = computed(() => (isDark.value ? "/favicon-dark.svg" : "/favicon.svg"));
let hasInitialized = false;
let mq: MediaQueryList | null = null;

function canUseBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function applyTheme(value: boolean) {
  if (!canUseBrowser()) return;
  document.documentElement.classList.toggle("dark", value);
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) favicon.href = value ? "/favicon-dark.svg" : "/favicon.svg";
}

function resolve() {
  if (mode.value === "system") {
    isDark.value = mq?.matches ?? false;
  } else {
    isDark.value = mode.value === "dark";
  }
}

function initTheme() {
  if (!canUseBrowser() || hasInitialized) return;

  mq = window.matchMedia("(prefers-color-scheme: dark)");

  const stored = localStorage.getItem("theme-mode") as ThemeMode | null;
  if (stored === "light" || stored === "dark") {
    mode.value = stored;
  }

  resolve();
  applyTheme(isDark.value);

  mq.addEventListener("change", () => {
    if (mode.value === "system") resolve();
  });

  watch(mode, (value) => {
    localStorage.setItem("theme-mode", value);
    resolve();
  });

  watch(isDark, (value) => {
    applyTheme(value);
  });

  hasInitialized = true;
}

export function useTheme() {
  initTheme();

  function setMode(value: ThemeMode) {
    mode.value = value;
  }

  return { isDark, mode, logoSrc, setMode };
}
