<script setup lang="ts">
import { watch, shallowRef, computed } from "vue";
import { Wallet } from "lucide-vue-next";
import { usePortfolio } from "../../composables/usePortfolio";
import { formatBalance, formatCurrency } from "../../utils/format";
import { getTokenKey } from "../../utils/tokens";
import TokenLogo from "../ui/TokenLogo.vue";

const expanded = shallowRef(false);
const { tokens, isLoading, markTokenTrusted, scopeKey, trustedTokenKeys } = usePortfolio();

const extraTokens = computed(() =>
  tokens.value.filter((token) => !trustedTokenKeys.value.has(getTokenKey(token.token))),
);

const trustedTokens = computed(() =>
  tokens.value.filter((token) => trustedTokenKeys.value.has(getTokenKey(token.token))),
);

watch(
  scopeKey,
  () => {
    expanded.value = false;
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="isLoading && tokens.length === 0" class="flex flex-col gap-3">
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
    <div v-else-if="tokens.length > 0" class="flex flex-col gap-1">
      <!-- Trusted tokens (always visible) -->
      <div
        v-for="tb in trustedTokens"
        :key="getTokenKey(tb.token)"
        class="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800/50"
      >
        <TokenLogo
          :urls="tb.logoUrls"
          :symbol="tb.token.symbol"
          @logo-loaded="markTokenTrusted(getTokenKey(tb.token))"
        />

        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
            {{ tb.token.symbol }}
          </p>
          <p class="truncate text-xs text-surface-400 dark:text-surface-500">
            {{ tb.token.name }}
          </p>
        </div>

        <div class="text-right">
          <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
            {{ formatBalance(tb.balance, tb.token.decimals) }}
          </p>
          <p v-if="tb.fiatValue !== null" class="text-xs text-surface-400 dark:text-surface-500">
            {{ formatCurrency(tb.fiatValue) }}
          </p>
        </div>
      </div>

      <!-- Extra tokens (expandable with animation) -->
      <div
        v-if="extraTokens.length > 0"
        class="grid transition-[grid-template-rows] duration-300"
        :style="{
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }"
      >
        <div class="overflow-hidden">
          <div
            v-for="tb in extraTokens"
            :key="getTokenKey(tb.token)"
            class="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800/50"
          >
            <TokenLogo
              :urls="tb.logoUrls"
              :symbol="tb.token.symbol"
              @logo-loaded="markTokenTrusted(getTokenKey(tb.token))"
            />

            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
                {{ tb.token.symbol }}
              </p>
              <p class="truncate text-xs text-surface-400 dark:text-surface-500">
                {{ tb.token.name }}
              </p>
            </div>

            <div class="text-right">
              <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
                {{ formatBalance(tb.balance, tb.token.decimals) }}
              </p>
              <p
                v-if="tb.fiatValue !== null"
                class="text-xs text-surface-400 dark:text-surface-500"
              >
                {{ formatCurrency(tb.fiatValue) }}
              </p>
            </div>
          </div>
        </div>
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
    <div v-else-if="!isLoading" class="flex flex-col items-center gap-3 py-12 text-center">
      <div
        class="empty-float flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
      >
        <Wallet class="h-6 w-6 text-surface-400 dark:text-surface-500" />
      </div>
      <div class="flex flex-col gap-1">
        <p class="text-base font-medium text-surface-700 dark:text-surface-300">No tokens yet</p>
        <p class="text-sm text-surface-400 dark:text-surface-500">
          Tokens will appear here once you receive funds
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
</style>
