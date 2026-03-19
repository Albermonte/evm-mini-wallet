<script setup lang="ts">
import { computed } from "vue";
import { usePortfolio } from "../../composables/usePortfolio";
import { formatCurrency } from "../../utils/format";
import { useAnimatedNumber } from "../../composables/useAnimatedNumber";

const { isLoading, portfolioTotalFiat } = usePortfolio();

const animatedTotal = useAnimatedNumber(() => portfolioTotalFiat.value ?? 0, {
  duration: 900,
});

const formattedBalance = computed(() => formatCurrency(animatedTotal.value));
</script>

<template>
  <div class="text-center">
    <!-- Skeleton -->
    <div v-if="isLoading" class="flex justify-center">
      <div class="h-16 w-52 animate-pulse rounded-2xl bg-surface-200 dark:bg-surface-700" />
    </div>

    <p
      v-else
      class="font-display text-[3.5rem] font-extrabold leading-none tracking-tighter text-black sm:text-7xl dark:text-white"
      style="overflow-wrap: break-word; min-width: 0"
    >
      {{ formattedBalance }}
    </p>
  </div>
</template>
