<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "reka-ui";
import { X } from "lucide-vue-next";

defineProps<{
  title?: string;
}>();

const open = defineModel<boolean>({ default: false });
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
      <DialogContent
        :aria-label="title ? undefined : 'Dialog'"
        class="dialog-content fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-surface-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900"
      >
        <div v-if="title" class="mb-4 flex items-center justify-between">
          <DialogTitle class="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {{ title }}
          </DialogTitle>
          <DialogClose
            aria-label="Close modal"
            class="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
          >
            <X class="h-5 w-5" />
          </DialogClose>
        </div>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.dialog-overlay {
  animation: overlayShow 200ms ease;
}
.dialog-overlay[data-state="closed"] {
  animation: overlayHide 150ms ease forwards;
}
.dialog-content {
  animation: contentShow 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dialog-content[data-state="closed"] {
  animation: contentHide 150ms ease forwards;
}
@keyframes overlayShow {
  from {
    opacity: 0;
  }
}
@keyframes overlayHide {
  to {
    opacity: 0;
  }
}
@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
}
@keyframes contentHide {
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
}
</style>
