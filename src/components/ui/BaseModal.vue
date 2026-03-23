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
        class="drawer-content fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border-t border-surface-200 bg-white px-5 pb-8 pt-3 shadow-2xl sm:px-6 dark:border-surface-700 dark:bg-surface-900"
      >
        <div class="mb-3 flex justify-center">
          <div class="h-1.5 w-12 rounded-full bg-surface-300 dark:bg-surface-600" />
        </div>
        <div v-if="title" class="mb-5">
          <DrawerTitle class="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {{ title }}
          </DrawerTitle>
          <DrawerDescription v-if="description" class="sr-only">
            {{ description }}
          </DrawerDescription>
        </div>
        <slot />
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped>
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
