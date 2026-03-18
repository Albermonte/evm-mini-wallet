<script setup lang="ts">
import { LoaderCircle } from "lucide-vue-next";

withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "ghost" | "danger";
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    type: "button",
  },
);
</script>

<template>
  <button
    :type="type"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm',
      {
        'bg-surface-900 text-white hover:bg-black active:bg-black dark:bg-white dark:text-surface-900 dark:hover:bg-surface-100 dark:active:bg-surface-200':
          variant === 'primary' || !variant,
        'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700':
          variant === 'secondary',
        'text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800':
          variant === 'ghost',
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800': variant === 'danger',
      },
    ]"
    :disabled="disabled || loading"
  >
    <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
    <slot />
  </button>
</template>
