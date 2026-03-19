<script setup lang="ts">
import { ToastRoot, ToastTitle, ToastClose, ToastViewport } from "reka-ui";
import { X } from "lucide-vue-next";
import { useToast } from "../../composables/useToast";

const EXIT_DURATION = 200;
const { toasts, removeToast } = useToast();

function onClose(id: number) {
  setTimeout(() => removeToast(id), EXIT_DURATION);
}

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
      'toast-item flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg',
      typeStyles[toast.type],
    ]"
    @update:open="
      (open: boolean) => {
        if (!open) onClose(toast.id);
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
    class="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-96"
  />
</template>

<style>
.toast-item[data-state="open"] {
  animation: toastEnter 300ms var(--ease-out-expo);
}

.toast-item[data-state="closed"] {
  animation: toastExit 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes toastEnter {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastExit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
}

/* Swipe gestures */
.toast-item[data-swipe="move"] {
  transform: translateY(var(--reka-toast-swipe-move-y));
}
.toast-item[data-swipe="cancel"] {
  transform: translateY(0);
  transition: transform 200ms ease;
}
.toast-item[data-swipe="end"] {
  animation: toastSwipeOut 100ms ease forwards;
}

@keyframes toastSwipeOut {
  to {
    transform: translateY(var(--reka-toast-swipe-end-y));
    opacity: 0;
  }
}

@media (min-width: 640px) {
  .toast-item[data-swipe="move"] {
    transform: translateX(var(--reka-toast-swipe-move-x));
  }
  .toast-item[data-swipe="end"] {
    animation: toastSwipeOutRight 100ms ease forwards;
  }
}

@keyframes toastSwipeOutRight {
  to {
    transform: translateX(var(--reka-toast-swipe-end-x));
    opacity: 0;
  }
}
</style>
