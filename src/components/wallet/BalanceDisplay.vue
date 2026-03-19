<script setup lang="ts">
import { usePortfolio } from "../../composables/usePortfolio";
import { formatCurrency } from "../../utils/format";

const { isLoading, portfolioTotalFiat } = usePortfolio();
</script>

<template>
  <div class="py-8 sm:py-10">
    <!-- Skeleton loader -->
    <div v-if="isLoading">
      <div class="h-14 w-56 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
    </div>

    <p
      v-else
      class="font-display text-5xl font-extrabold tracking-tighter text-surface-900 sm:text-6xl dark:text-white"
      style="overflow-wrap: break-word; min-width: 0"
    >
      {{ formatCurrency(portfolioTotalFiat ?? 0) }}
    </p>
  </div>
</template>
