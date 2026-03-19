<script setup lang="ts">
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from "reka-ui";
import { Settings, Monitor, Sun, Moon } from "lucide-vue-next";
import { ref } from "vue";
import { useTheme, type ThemeMode } from "../../composables/useTheme";

const { mode, setMode } = useTheme();
const open = ref(false);

const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];
</script>

<template>
  <div class="fixed bottom-5 right-5" style="padding-bottom: env(safe-area-inset-bottom)">
    <PopoverRoot v-model:open="open">
      <PopoverTrigger as-child>
        <button
          aria-label="Settings"
          class="flex h-10 w-10 items-center justify-center rounded-full border border-surface-200 bg-white text-surface-500 shadow-md transition-colors hover:bg-surface-50 hover:text-surface-700 active:scale-95 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400 dark:hover:text-surface-200"
        >
          <Settings class="h-[18px] w-[18px]" />
        </button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          class="popover-content z-50 w-44 rounded-xl border border-surface-200 bg-white p-1.5 shadow-lg dark:border-surface-700 dark:bg-surface-900"
          side="top"
          :side-offset="8"
          align="end"
        >
          <p
            class="px-2 pb-1.5 pt-1 text-[11px] font-semibold tracking-wide text-surface-400 uppercase dark:text-surface-500"
          >
            Theme
          </p>
          <button
            v-for="opt in options"
            :key="opt.value"
            class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors"
            :class="
              mode === opt.value
                ? 'bg-surface-100 font-semibold text-black dark:bg-surface-800 dark:text-white'
                : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800/50'
            "
            @click="setMode(opt.value)"
          >
            <component :is="opt.icon" class="h-4 w-4" />
            {{ opt.label }}
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>

<style scoped>
.popover-content[data-state="open"] {
  animation: popoverShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.popover-content[data-state="closed"] {
  animation: popoverHide 100ms ease forwards;
}

@keyframes popoverShow {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.96);
  }
}
@keyframes popoverHide {
  to {
    opacity: 0;
    transform: translateY(4px) scale(0.96);
  }
}
</style>
