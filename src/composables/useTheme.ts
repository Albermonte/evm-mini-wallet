import { computed, shallowRef, watch } from "vue";

const isDark = shallowRef(false);
const logoSrc = computed(() => (isDark.value ? "/favicon-dark.svg" : "/favicon.svg"));
let hasInitialized = false;

function canUseBrowser() {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof localStorage !== "undefined"
  );
}

function applyTheme(value: boolean) {
  if (!canUseBrowser()) return;
  document.documentElement.classList.toggle("dark", value);
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) favicon.href = value ? "/favicon-dark.svg" : "/favicon.svg";
}

function initTheme() {
  if (!canUseBrowser() || hasInitialized) return;

  const stored = window.localStorage.getItem("theme");
  if (stored) {
    isDark.value = stored === "dark";
  } else {
    isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  applyTheme(isDark.value);

  watch(isDark, (value) => {
    applyTheme(value);
    window.localStorage.setItem("theme", value ? "dark" : "light");
  });

  hasInitialized = true;
}

export function useTheme() {
  initTheme();

  function toggle() {
    isDark.value = !isDark.value;
  }

  return { isDark, logoSrc, toggle };
}
