<script setup lang="ts">
import { ToastRoot, ToastTitle, ToastClose, ToastViewport } from "reka-ui";
import { X } from "lucide-vue-next";
import { useToast } from "../../composables/useToast";

const { toasts, removeToast } = useToast();

const typeStyles = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-surface-800 text-white dark:bg-surface-200 dark:text-surface-900",
};
</script>

<template>
  <ToastRoot
    v-for="toast in toasts"
    :key="toast.id"
    :duration="toast.duration"
    :type="toast.type === 'error' ? 'foreground' : 'background'"
    :class="[
      'toast-item flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:w-auto sm:max-w-sm',
      typeStyles[toast.type],
    ]"
    @update:open="
      (open: boolean) => {
        if (!open) removeToast(toast.id);
      }
    "
  >
    <ToastTitle class="flex-1">{{ toast.message }}</ToastTitle>
    <ToastClose
      aria-label="Dismiss notification"
      class="opacity-70 transition-opacity hover:opacity-100"
    >
      <X class="h-4 w-4" />
    </ToastClose>
  </ToastRoot>

  <ToastViewport
    class="fixed bottom-4 right-4 z-[100] flex w-96 max-w-[calc(100%-2rem)] flex-col gap-2"
  />
</template>

<style scoped>
.toast-item[data-state="open"] {
  animation: toastSlideIn 300ms ease;
}
.toast-item[data-state="closed"] {
  animation: toastSlideOut 200ms ease forwards;
}
.toast-item[data-swipe="move"] {
  transform: translateX(var(--reka-toast-swipe-move-x));
}
.toast-item[data-swipe="cancel"] {
  transform: translateX(0);
  transition: transform 200ms ease;
}
.toast-item[data-swipe="end"] {
  animation: toastSwipeOut 100ms ease forwards;
}
@keyframes toastSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
}
@keyframes toastSlideOut {
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
@keyframes toastSwipeOut {
  to {
    transform: translateX(var(--reka-toast-swipe-end-x));
    opacity: 0;
  }
}
</style>
