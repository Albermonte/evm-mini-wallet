<script setup lang="ts">
import TokenLogo from "./TokenLogo.vue";
import { formatBalance, formatCurrency } from "../../utils/format";

defineProps<{
  logoUrls: string[];
  symbol: string;
  name: string;
  balance: bigint;
  decimals: number;
  fiatValue: number | null;
}>();

defineEmits<{
  "logo-loaded": [];
}>();
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800/50"
  >
    <TokenLogo :urls="logoUrls" :symbol="symbol" @logo-loaded="$emit('logo-loaded')" />

    <div class="min-w-0 flex-1">
      <p class="text-sm font-medium text-surface-900 dark:text-surface-100">{{ symbol }}</p>
      <p class="truncate text-xs text-surface-400 dark:text-surface-500">{{ name }}</p>
    </div>

    <div class="text-right">
      <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
        {{ formatBalance(balance, decimals) }}
      </p>
      <p v-if="fiatValue !== null" class="text-xs text-surface-400 dark:text-surface-500">
        {{ formatCurrency(fiatValue) }}
      </p>
    </div>
  </div>
</template>
