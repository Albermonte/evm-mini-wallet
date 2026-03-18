<script setup lang="ts">
import { shallowRef, watch } from "vue";

const props = defineProps<{
  urls: string[];
  symbol: string;
  size?: string;
}>();

const emit = defineEmits<{
  (e: "logo-failed"): void;
  (e: "logo-loaded"): void;
}>();

const currentIndex = shallowRef(0);
const failed = shallowRef(false);

function onError() {
  if (currentIndex.value < props.urls.length - 1) {
    currentIndex.value++;
  } else {
    failed.value = true;
    emit("logo-failed");
  }
}

watch(
  () => props.urls,
  () => {
    currentIndex.value = 0;
    failed.value = false;
  },
);
</script>

<template>
  <img
    v-if="urls.length > 0 && !failed"
    :src="urls[currentIndex]"
    :alt="symbol"
    class="shrink-0 rounded-full"
    :class="size ?? 'h-8 w-8'"
    @load="emit('logo-loaded')"
    @error="onError"
  />
  <div
    v-else
    class="flex shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-bold text-surface-600 dark:bg-surface-800 dark:text-surface-300"
    :class="size ?? 'h-8 w-8'"
  >
    {{ symbol.slice(0, 2) }}
  </div>
</template>
