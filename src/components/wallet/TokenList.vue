<script setup lang="ts">
import { watch, shallowRef, computed } from "vue";
import { Wallet } from "lucide-vue-next";
import { usePortfolio } from "../../composables/usePortfolio";
import { getTokenKey } from "../../utils/tokens";
import TokenRow from "../ui/TokenRow.vue";
import EmptyState from "../ui/EmptyState.vue";

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
      <TokenRow
        v-for="tb in trustedTokens"
        :key="getTokenKey(tb.token)"
        :logo-urls="tb.logoUrls"
        :symbol="tb.token.symbol"
        :name="tb.token.name"
        :balance="tb.balance"
        :decimals="tb.token.decimals"
        :fiat-value="tb.fiatValue"
        @logo-loaded="markTokenTrusted(getTokenKey(tb.token))"
      />

      <!-- Extra tokens (expandable with animation) -->
      <div
        v-if="extraTokens.length > 0"
        class="grid transition-[grid-template-rows] duration-300"
        :style="{
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transitionTimingFunction: 'var(--ease-out-expo)',
        }"
      >
        <div class="overflow-hidden">
          <TokenRow
            v-for="tb in extraTokens"
            :key="getTokenKey(tb.token)"
            :logo-urls="tb.logoUrls"
            :symbol="tb.token.symbol"
            :name="tb.token.name"
            :balance="tb.balance"
            :decimals="tb.token.decimals"
            :fiat-value="tb.fiatValue"
            @logo-loaded="markTokenTrusted(getTokenKey(tb.token))"
          />
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
    <EmptyState
      v-else-if="!isLoading"
      title="No tokens yet"
      description="Tokens will appear here once you receive funds"
    >
      <template #icon>
        <Wallet class="h-6 w-6 text-surface-400 dark:text-surface-500" />
      </template>
    </EmptyState>
  </div>
</template>
