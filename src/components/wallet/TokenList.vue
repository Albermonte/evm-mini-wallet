<script setup lang="ts">
import { watch, shallowRef, ref, computed } from "vue";
import { useConnection, useChainId } from "@wagmi/vue";
import { useTimeoutPoll } from "@vueuse/core";
import { fetchBlockscoutTokens, type TokenWithBalance } from "../../utils/blockscout";
import { formatBalance } from "../../utils/format";
import TokenLogo from "../ui/TokenLogo.vue";

const { address } = useConnection();
const chainId = useChainId();

const tokenBalances = ref<TokenWithBalance[]>([]);
const isLoading = shallowRef(false);
const expanded = shallowRef(false);
const succeededLogos = ref(new Set<string>());

function onLogoLoaded(tokenAddress: string) {
  succeededLogos.value.add(tokenAddress);
  succeededLogos.value = new Set(succeededLogos.value);
}

const extraTokens = computed(() =>
  tokenBalances.value.filter((t) => !succeededLogos.value.has(t.token.address)),
);

async function fetchBalances() {
  if (!address.value || !chainId.value) {
    tokenBalances.value = [];
    return;
  }

  isLoading.value = true;
  try {
    const tokens = await fetchBlockscoutTokens(chainId.value, address.value);
    tokenBalances.value = tokens.filter((t) => t.balance > 0n);
  } catch {
    tokenBalances.value = [];
  }
  succeededLogos.value = new Set();
  expanded.value = false;
  isLoading.value = false;
}

useTimeoutPoll(fetchBalances, 30_000, { immediateCallback: true });
watch([chainId, address], fetchBalances);
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="isLoading && tokenBalances.length === 0" class="flex flex-col gap-3">
      <div v-for="i in 3" :key="i" class="flex items-center gap-3">
        <div class="h-8 w-8 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
        <div class="flex-1">
          <div class="h-4 w-20 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div class="mt-1 h-3 w-14 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        </div>
        <div class="h-4 w-16 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
      </div>
    </div>

    <!-- Token list -->
    <div v-else-if="tokenBalances.length > 0" class="flex flex-col gap-1">
      <div
        v-for="tb in tokenBalances"
        :key="tb.token.address"
        v-show="succeededLogos.has(tb.token.address) || expanded"
        class="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800/50"
      >
        <TokenLogo
          :urls="tb.logoUrls"
          :symbol="tb.token.symbol"
          @logo-loaded="onLogoLoaded(tb.token.address)"
        />

        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
            {{ tb.token.symbol }}
          </p>
          <p class="truncate text-xs text-surface-400 dark:text-surface-500">
            {{ tb.token.name }}
          </p>
        </div>

        <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
          {{ formatBalance(tb.balance, tb.token.decimals) }}
        </p>
      </div>

      <button
        v-if="extraTokens.length > 0"
        class="mt-1 w-full rounded-lg py-2 text-sm font-medium text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:text-surface-500 dark:hover:bg-surface-800/50 dark:hover:text-surface-300"
        @click="expanded = !expanded"
      >
        {{
          expanded
            ? "Show less"
            : `Show ${extraTokens.length} more token${extraTokens.length === 1 ? "" : "s"}`
        }}
      </button>
    </div>

    <!-- No tokens with balance -->
    <div v-else-if="!isLoading" class="flex flex-col items-center gap-1.5 py-8 text-center">
      <p class="text-sm font-medium text-surface-500 dark:text-surface-400">No tokens yet</p>
      <p class="text-xs text-surface-400 dark:text-surface-500">
        Receive, swap, or bridge tokens to see them here
      </p>
    </div>
  </div>
</template>
