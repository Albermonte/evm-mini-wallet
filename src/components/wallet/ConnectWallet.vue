<script setup lang="ts">
import { ref } from "vue";
import { useChainId, useConnect } from "@wagmi/vue";
import { injected } from "@wagmi/vue/connectors";
import { Wallet, LoaderCircle } from "lucide-vue-next";
import BaseButton from "../ui/BaseButton.vue";
import BaseModal from "../ui/BaseModal.vue";
import { useToast } from "../../composables/useToast";
import { useEip6963Providers, type EIP6963ProviderDetail } from "../../composables/useEip6963";
import { isUserRejection } from "../../utils/validation";

const chainId = useChainId();
const { connect, isPending } = useConnect();
const { providers } = useEip6963Providers();
const showModal = ref(false);
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
      onSuccess() {
        showModal.value = false;
      },
      onError(err) {
        if (isUserRejection(err)) {
          addToast("Connection rejected", "info");
        } else {
          addToast(err.message, "error");
        }
      },
    },
  );
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-10 sm:gap-6 sm:py-16">
    <div
      class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg"
    >
      <Wallet class="h-10 w-10" :stroke-width="1.5" />
    </div>

    <div class="text-center">
      <h1 class="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
        EVM Mini Wallet
      </h1>
      <p class="mt-2 text-surface-500 dark:text-surface-400">Connect your wallet to get started</p>
    </div>

    <BaseButton variant="primary" class="px-8 py-3 text-base" @click="showModal = true">
      Connect Wallet
    </BaseButton>

    <BaseModal v-model="showModal" title="Connect Wallet">
      <div class="flex flex-col gap-2">
        <p v-if="providers.length === 0" class="py-4 text-center text-sm text-surface-500">
          No wallet detected.
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener"
            class="text-primary-600 hover:underline dark:text-primary-400"
          >
            Install MetaMask
          </a>
        </p>

        <button
          v-for="provider in providers"
          :key="provider.info.uuid"
          :disabled="isPending"
          class="flex items-center gap-3 rounded-xl border border-surface-200 px-4 py-3 text-left text-sm font-medium text-surface-900 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-700 dark:text-surface-100 dark:hover:bg-surface-800"
          @click="handleConnect(provider)"
        >
          <img :src="provider.info.icon" :alt="provider.info.name" class="h-8 w-8 rounded-lg" />
          {{ provider.info.name }}
          <LoaderCircle v-if="isPending" class="ml-auto h-4 w-4 animate-spin text-surface-400" />
        </button>
      </div>
    </BaseModal>
  </div>
</template>
