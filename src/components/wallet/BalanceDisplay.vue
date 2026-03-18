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
  <div class="flex flex-col items-center gap-2 py-6 sm:py-8">
    <!-- Skeleton loader -->
    <div v-if="isLoading" class="flex flex-col items-center gap-3">
      <div class="h-12 w-48 animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700" />
      <div class="h-5 w-20 animate-pulse rounded-md bg-surface-200 dark:bg-surface-700" />
    </div>

    <template v-else-if="balance">
      <p
        class="text-4xl sm:text-5xl font-bold text-surface-900 dark:text-surface-100 break-all text-center tracking-tight"
      >
        {{ formatBalance(balance.value) }}
      </p>
      <div class="flex items-center gap-1.5">
        <img
          :src="getChainLogo(chainId ?? 1)"
          :alt="chainMeta[chainId ?? 1]?.chain.name"
          class="h-4 w-4 rounded-full"
        />
        <span class="text-sm text-surface-500 dark:text-surface-400">
          {{ balance.symbol }}
        </span>
      </div>
    </template>

    <p v-else class="text-lg text-surface-400">--</p>
  </div>
</template>
