<script setup lang="ts">
import { useConnection } from "@wagmi/vue";
import { TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent, TooltipArrow } from "reka-ui";
import { Copy } from "lucide-vue-next";
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
          class="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-surface-200 px-2 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 active:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
          @click="copyAddress"
        >
          {{ truncateAddress(address) }}
          <Copy class="h-3.5 w-3.5 shrink-0 text-surface-400" />
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
