<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-12 text-center">
    <div
      class="empty-float flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
    >
      <slot name="icon" />
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-base font-medium text-surface-700 dark:text-surface-300">{{ title }}</p>
      <p class="text-sm text-surface-400 dark:text-surface-500">{{ description }}</p>
    </div>
  </div>
</template>
