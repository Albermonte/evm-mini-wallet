<script setup lang="ts">
import { usePortfolio } from "../../composables/usePortfolio";
import { formatCurrency } from "../../utils/format";

const { isLoading, portfolioTotalFiat } = usePortfolio();
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-8 sm:py-10">
    <!-- Skeleton loader -->
    <div v-if="isLoading" class="flex flex-col items-center gap-3">
      <div class="h-14 w-56 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
      <div class="h-6 w-24 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
    </div>

    <template v-else-if="portfolioTotalFiat !== null">
      <p
        class="max-w-full text-center font-display text-5xl font-extrabold tracking-tighter text-surface-900 sm:text-6xl dark:text-white"
        style="overflow-wrap: break-word"
      >
        {{ formatCurrency(portfolioTotalFiat) }}
      </p>
      <div
        class="flex items-center gap-1.5 rounded-full border border-surface-200 px-3 py-1 dark:border-surface-700"
      >
        <span class="text-sm font-medium text-surface-500 dark:text-surface-400"> USD </span>
      </div>
    </template>

    <p v-else class="text-lg text-surface-400">--</p>
  </div>
</template>
