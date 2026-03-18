<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div
    class="rounded-xl border border-surface-300 bg-white p-5 dark:border-surface-700 dark:bg-surface-900"
  >
    <h3 v-if="title" class="mb-4 text-base font-semibold text-surface-900 dark:text-surface-100">
      {{ title }}
    </h3>
    <slot />
  </div>
</template>
