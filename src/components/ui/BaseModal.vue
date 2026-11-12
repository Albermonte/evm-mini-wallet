<script setup lang="ts">
import {
  DrawerRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "vaul-vue";

defineProps<{
  title?: string;
  description?: string;
}>();

const open = defineModel<boolean>({ default: false });
</script>

<template>
  <DrawerRoot v-model:open="open">
    <DrawerPortal>
      <DrawerOverlay class="drawer-overlay fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
      <DrawerContent
        :aria-label="title ? undefined : 'Dialog'"
        class="drawer-content fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border-t border-surface-200 bg-white pt-3 shadow-2xl dark:border-surface-700 dark:bg-surface-900"
      >
        <div class="mb-3 flex shrink-0 justify-center">
          <div class="h-1.5 w-12 rounded-full bg-surface-300 dark:bg-surface-600" />
        </div>
        <div v-if="title" class="mb-5 shrink-0 px-5 sm:px-6">
          <DrawerTitle class="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {{ title }}
          </DrawerTitle>
          <DrawerDescription v-if="description" class="sr-only">
            {{ description }}
          </DrawerDescription>
        </div>
        <div data-modal-body class="modal-body min-h-0 flex-1 overflow-y-auto px-5 pb-8 sm:px-6">
          <slot />
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped>
.modal-body {
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--color-surface-300) transparent;
}
:global(.dark) .modal-body {
  scrollbar-color: var(--color-surface-600) transparent;
}
.drawer-overlay {
  animation: overlayIn 200ms ease;
}
.drawer-overlay[data-state="closed"] {
  animation: overlayOut 150ms ease forwards;
}
.drawer-content {
  animation: sheetSlideUp 400ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content[data-state="closed"] {
  animation: sheetSlideDown 200ms var(--ease-out-expo) forwards;
}
@keyframes sheetSlideUp {
  from {
    transform: translateY(100%);
  }
}
@keyframes sheetSlideDown {
  to {
    transform: translateY(100%);
  }
}
</style>
