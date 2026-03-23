<script setup lang="ts">
import { useConnection } from "@wagmi/vue";
import { TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent, TooltipArrow } from "reka-ui";
import { Copy, Check } from "lucide-vue-next";
import { truncateAddress } from "../../utils/format";
import { useClipboard } from "../../composables/useClipboard";
import { useToast } from "../../composables/useToast";

const { address } = useConnection();
const { copied, copy } = useClipboard();
const { addToast } = useToast();
const emit = defineEmits<{
  openReceive: [];
}>();

function copyAddress() {
  if (address.value) {
    copy(address.value);
    addToast("Address copied", "success");
  }
}
</script>

<template>
  <div v-if="address" class="flex items-center gap-1">
    <button
      type="button"
      aria-label="Open receive sheet"
      class="flex min-h-[36px] items-center rounded-md border border-surface-300 px-2.5 py-1.5 text-xs font-semibold text-surface-900 transition-colors hover:bg-surface-100 active:bg-surface-200 dark:border-surface-600 dark:text-surface-100 dark:hover:bg-surface-800"
      @click="emit('openReceive')"
    >
      {{ truncateAddress(address) }}
    </button>
    <TooltipRoot>
      <TooltipTrigger as-child>
        <button
          type="button"
          aria-label="Copy wallet address"
          class="flex min-h-[36px] items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors"
          :class="
            copied
              ? 'border-surface-900 bg-surface-900 text-white dark:border-surface-100 dark:bg-surface-100 dark:text-surface-900'
              : 'border-surface-300 text-surface-700 hover:bg-surface-100 active:bg-surface-200 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-800'
          "
          @click="copyAddress"
        >
          <Check v-if="copied" class="h-3.5 w-3.5 shrink-0" />
          <Copy v-else class="h-3.5 w-3.5 shrink-0 text-surface-400" />
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          class="tooltip-content rounded-lg bg-surface-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-surface-100 dark:text-surface-900"
          :side-offset="5"
        >
          {{ copied ? "Copied!" : "Copy address" }}
          <TooltipArrow class="fill-surface-900 dark:fill-surface-100" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </div>
</template>

<style scoped>
.tooltip-content[data-state="delayed-open"] {
  animation: tooltipShow 150ms ease;
}
@keyframes tooltipShow {
  from {
    opacity: 0;
  }
}
</style>
