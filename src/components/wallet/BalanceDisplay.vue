<script setup lang="ts">
import { useConnection, useChainId, useBalance } from "@wagmi/vue";
import { formatBalance } from "../../utils/format";
import { chainMeta, getChainLogo } from "../../utils/chains";

const { address } = useConnection();
const chainId = useChainId();
const { data: balance, isLoading } = useBalance({
  address,
  query: { refetchInterval: 30_000 },
});
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-8 sm:py-10">
    <!-- Skeleton loader -->
    <div v-if="isLoading" class="flex flex-col items-center gap-3">
      <div class="h-14 w-56 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
      <div class="h-6 w-24 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
    </div>

    <template v-else-if="balance">
      <p
        class="max-w-full text-center font-display text-5xl font-bold tracking-tight text-surface-900 sm:text-6xl dark:text-surface-100"
        style="overflow-wrap: break-word"
      >
        {{ formatBalance(balance.value) }}
      </p>
      <div
        class="flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1 dark:bg-surface-800"
      >
        <img
          :src="getChainLogo(chainId ?? 1)"
          :alt="chainMeta[chainId ?? 1]?.chain.name"
          class="h-4 w-4 rounded-full"
        />
        <span class="text-sm font-medium text-surface-500 dark:text-surface-400">
          {{ balance.symbol }}
        </span>
      </div>
    </template>

    <p v-else class="text-lg text-surface-400">--</p>
  </div>
</template>
