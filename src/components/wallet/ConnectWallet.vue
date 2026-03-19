<script setup lang="ts">
import { useChainId, useConnect, useSwitchChain } from "@wagmi/vue";
import { injected } from "@wagmi/vue/connectors";
import { LoaderCircle } from "lucide-vue-next";
import { useToast } from "../../composables/useToast";
import { useEip6963Providers, type EIP6963ProviderDetail } from "../../composables/useEip6963";
import { isUserRejection } from "../../utils/validation";
import { getChainLogo } from "../../utils/chains";

const chainId = useChainId();
const { connect, isPending } = useConnect();
const { chains } = useSwitchChain();
const { providers } = useEip6963Providers();
const { addToast } = useToast();

function handleConnect(detail: EIP6963ProviderDetail) {
  connect(
    {
      connector: injected({
        target: {
          id: detail.info.rdns,
          name: detail.info.name,
          icon: detail.info.icon,
          provider: detail.provider,
        },
      }),
      chainId: chainId.value,
    },
    {
      onError(err) {
        if (isUserRejection(err)) {
          addToast("You cancelled the connection", "info");
        } else {
          addToast(err.message, "error");
        }
      },
    },
  );
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:py-16">
    <div class="w-full max-w-sm">
      <div class="connect-entrance mb-10 text-center">
        <h1
          class="font-display text-4xl font-extrabold tracking-tighter text-black sm:text-5xl dark:text-white"
        >
          EVM Mini Wallet
        </h1>
        <p class="mt-3 text-surface-500 dark:text-surface-400">
          Manage and send tokens across multiple chains
        </p>
      </div>

      <!-- Wallet providers inline -->
      <div class="mb-10 flex flex-col gap-2">
        <p
          v-if="providers.length === 0"
          class="connect-entrance rounded-lg border border-dashed border-surface-400 px-4 py-8 text-center text-sm text-surface-500 dark:border-surface-500 dark:text-surface-400"
          style="--entrance-delay: 150ms"
        >
          No wallet detected.
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener"
            class="font-medium text-surface-900 underline decoration-surface-400 hover:decoration-surface-900 dark:text-white dark:decoration-surface-500 dark:hover:decoration-white"
          >
            Install a wallet
          </a>
          to get started.
        </p>

        <button
          v-for="(provider, i) in providers"
          :key="provider.info.uuid"
          :disabled="isPending"
          class="connect-entrance flex items-center gap-3 rounded-lg border-2 border-surface-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-black transition-all hover:border-black active:scale-[0.97] disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:hover:border-white"
          :style="{ '--entrance-delay': 150 + i * 80 + 'ms' }"
          @click="handleConnect(provider)"
        >
          <img :src="provider.info.icon" :alt="provider.info.name" class="h-9 w-9 rounded-lg" />
          <span class="flex-1">{{ provider.info.name }}</span>
          <LoaderCircle v-if="isPending" class="h-4 w-4 animate-spin text-surface-400" />
          <span v-else class="text-xs font-semibold text-surface-900 dark:text-white">Connect</span>
        </button>
      </div>

      <!-- Supported chains -->
      <div
        class="connect-entrance flex flex-col items-center gap-2.5"
        style="--entrance-delay: 350ms"
      >
        <span class="text-xs text-surface-400 dark:text-surface-500">Supported networks</span>
        <div class="flex flex-wrap justify-center gap-2">
          <div
            v-for="chain in chains"
            :key="chain.id"
            class="flex items-center gap-1.5 rounded-full border border-surface-200 px-2.5 py-1 dark:border-surface-700"
          >
            <img :src="getChainLogo(chain.id)" :alt="chain.name" class="h-3.5 w-3.5 rounded-full" />
            <span class="text-[11px] font-medium text-surface-600 dark:text-surface-400">
              {{ chain.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.connect-entrance {
  animation: entrance 500ms var(--entrance-delay, 0ms) var(--ease-out-expo) both;
}

@keyframes entrance {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
}
</style>
