<script setup lang="ts">
import { useConnection } from "@wagmi/vue";
import AccountInfo from "../wallet/AccountInfo.vue";
import ChainSelector from "../wallet/ChainSelector.vue";
import { useTheme } from "../../composables/useTheme";

const { isConnected } = useConnection();
const { logoSrc } = useTheme();
</script>

<template>
  <header class="flex items-center px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
    <!-- Left: Logo -->
    <div class="flex flex-1 items-center gap-2">
      <img :src="logoSrc" alt="EVM Mini Wallet" class="h-7 w-7" />
      <span
        v-if="!isConnected"
        class="font-display text-[15px] font-bold tracking-tight text-black dark:text-white"
      >
        Mini Wallet
      </span>
    </div>

    <!-- Center: Account address (when connected) -->
    <AccountInfo v-if="isConnected" />

    <!-- Right: Chain selector (when connected) -->
    <div class="flex flex-1 justify-end">
      <ChainSelector v-if="isConnected" />
    </div>
  </header>
</template>
