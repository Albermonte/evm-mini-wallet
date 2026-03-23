<script setup lang="ts">
import { watch, shallowRef, computed } from "vue";
import { Wallet } from "lucide-vue-next";
import { usePortfolio } from "../../composables/usePortfolio";
import { getTokenKey } from "../../utils/tokens";
import TokenRow from "../ui/TokenRow.vue";
import EmptyState from "../ui/EmptyState.vue";
import BaseButton from "../ui/BaseButton.vue";

const expanded = shallowRef(false);
const { tokens, isLoading, status, error, scopeKey, refetch } = usePortfolio();
const logoValidation = shallowRef<Record<string, boolean>>({});
let latestValidationVersion: symbol | null = null;
const previewTokenPool = computed(() =>
  tokens.value.filter((token) => logoValidation.value[getTokenKey(token.token)] === true),
);
const collapsedVisibleTokens = computed(() => previewTokenPool.value.slice(0, 3));
const visibleTokens = computed(() =>
  expanded.value ? tokens.value : collapsedVisibleTokens.value,
);
const hiddenTokenCount = computed(() =>
  Math.max(tokens.value.length - collapsedVisibleTokens.value.length, 0),
);

async function hasRenderableLogo(urls: string[]) {
  for (const url of urls) {
    const loaded = await new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = url;
    });

    if (loaded) return true;
  }

  return false;
}

watch(
  scopeKey,
  () => {
    expanded.value = false;
    logoValidation.value = {};
  },
  { immediate: true },
);

watch(
  [tokens, scopeKey],
  ([nextTokens]) => {
    const validationVersion = Symbol("logo-validation");
    latestValidationVersion = validationVersion;

    const availableKeys = new Set(nextTokens.map((token) => getTokenKey(token.token)));
    const nextValidation = Object.fromEntries(
      Object.entries(logoValidation.value).filter(([tokenKey]) => availableKeys.has(tokenKey)),
    );
    logoValidation.value = nextValidation;

    void Promise.all(
      nextTokens.map(async (token) => {
        const tokenKey = getTokenKey(token.token);
        if (nextValidation[tokenKey] !== undefined) {
          return [tokenKey, nextValidation[tokenKey]!] as const;
        }

        if (token.logoUrls.length === 0) {
          return [tokenKey, false] as const;
        }

        return [tokenKey, await hasRenderableLogo(token.logoUrls)] as const;
      }),
    ).then((results) => {
      if (latestValidationVersion !== validationVersion) return;

      logoValidation.value = Object.fromEntries(results);
    });
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
    <div v-else-if="status === 'success' && tokens.length > 0">
      <div class="flex flex-col gap-1">
        <TransitionGroup name="token-list" tag="div" class="flex flex-col gap-1">
          <TokenRow
            v-for="tb in visibleTokens"
            :key="tb.token.isNative ? `native:${tb.token.symbol}` : tb.token.address"
            :logo-urls="tb.logoUrls"
            :symbol="tb.token.symbol"
            :name="tb.token.name"
            :balance="tb.balance"
            :decimals="tb.token.decimals"
            :fiat-value="tb.fiatValue"
          />
        </TransitionGroup>

        <button
          v-if="hiddenTokenCount > 0"
          class="mt-1 w-full rounded-lg py-2 text-sm font-medium text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:text-surface-500 dark:hover:bg-surface-800/50 dark:hover:text-surface-300"
          @click="expanded = !expanded"
        >
          {{
            expanded
              ? "Show less"
              : `Show ${hiddenTokenCount} more token${hiddenTokenCount === 1 ? "" : "s"}`
          }}
        </button>
      </div>
    </div>

    <EmptyState
      v-else-if="status === 'error'"
      title="Could not load tokens"
      :description="error?.message ?? 'Try again in a moment'"
    >
      <template #icon>
        <Wallet class="h-6 w-6 text-surface-400 dark:text-surface-500" />
      </template>
      <BaseButton variant="ghost" @click="refetch()">Retry</BaseButton>
    </EmptyState>

    <EmptyState
      v-else-if="status === 'success' && !isLoading"
      title="No tokens yet"
      description="Tokens will appear here once you receive funds"
    >
      <template #icon>
        <Wallet class="h-6 w-6 text-surface-400 dark:text-surface-500" />
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.token-list-enter-active,
.token-list-leave-active,
.token-list-move {
  transition:
    opacity 220ms var(--ease-out-expo),
    transform 220ms var(--ease-out-expo);
}

.token-list-enter-from,
.token-list-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}
</style>
