<script setup lang="ts">
import { Toggle } from "reka-ui";
import { Sun, Moon } from "lucide-vue-next";
import { useTheme } from "../../composables/useTheme";

const { isDark } = useTheme();
</script>

<template>
  <Toggle
    v-model="isDark"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    class="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
  >
    <Sun v-if="isDark" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
  </Toggle>
</template>
