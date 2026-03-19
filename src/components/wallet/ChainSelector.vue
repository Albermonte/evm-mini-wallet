<script setup lang="ts">
import { ref } from "vue";
import { useChainId, useSwitchChain } from "@wagmi/vue";
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from "reka-ui";
import { ChevronDown, Check } from "lucide-vue-next";
import { chainMeta, getChainLogo, saveLastChainId } from "../../utils/chains";
import { useToast } from "../../composables/useToast";

const chainId = useChainId();
const { chains, switchChain } = useSwitchChain();
const { addToast } = useToast();
const open = ref(false);

function handleSwitch(id: number) {
  switchChain(
    { chainId: id },
    {
      onSuccess() {
        saveLastChainId(id);
        open.value = false;
      },
      onError(err) {
        addToast(err.message, "error");
      },
    },
  );
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        class="flex min-h-[36px] items-center gap-1.5 rounded-md border border-surface-300 px-2 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-800"
      >
        <img
          :src="getChainLogo(chainId ?? 1)"
          :alt="chainMeta[chainId ?? 1]?.chain.name"
          class="h-4 w-4 shrink-0 rounded-full"
        />
        <span>{{ chainMeta[chainId ?? 1]?.chain.name ?? "Unknown" }}</span>
        <ChevronDown class="h-3.5 w-3.5 shrink-0 text-surface-400" />
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        class="popover-content z-50 w-48 rounded-lg border border-surface-300 bg-white py-1 shadow-lg dark:border-surface-600 dark:bg-surface-900"
        :side-offset="4"
        align="end"
      >
        <button
          v-for="chain in chains"
          :key="chain.id"
          class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-100 active:bg-surface-200 dark:hover:bg-surface-800 dark:active:bg-surface-700"
          :class="
            chain.id === chainId
              ? 'text-surface-900 dark:text-white font-semibold'
              : 'text-surface-700 dark:text-surface-300'
          "
          @click="handleSwitch(chain.id)"
        >
          <img
            :src="getChainLogo(chain.id)"
            :alt="chain.name"
            class="h-4 w-4 shrink-0 rounded-full"
          />
          {{ chain.name }}
          <Check v-if="chain.id === chainId" class="ml-auto h-4 w-4" />
        </button>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped>
.popover-content[data-state="open"] {
  animation: popoverShow 150ms ease;
}
@keyframes popoverShow {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}
</style>
