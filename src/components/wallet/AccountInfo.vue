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

function copyAddress() {
  if (address.value) {
    copy(address.value);
    addToast("Address copied", "success");
  }
}
</script>

<template>
  <div v-if="address" class="flex items-center gap-1">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <button
          aria-label="Copy wallet address"
          class="flex min-h-[36px] items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors"
          :class="
            copied
              ? 'border-green-400 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400'
              : 'border-surface-300 text-surface-700 hover:bg-surface-100 active:bg-surface-200 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-800'
          "
          @click="copyAddress"
        >
          {{ truncateAddress(address) }}
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
