<script setup lang="ts">
import { useConnection } from "@wagmi/vue";
import ThemeToggle from "../ui/ThemeToggle.vue";
import ChainSelector from "../wallet/ChainSelector.vue";
import AccountInfo from "../wallet/AccountInfo.vue";
import { useTheme } from "../../composables/useTheme";

const { isConnected } = useConnection();
const { logoSrc } = useTheme();
</script>

<template>
  <header
    class="flex items-center justify-between border-b border-surface-300 px-3 py-2.5 sm:px-4 sm:py-3 dark:border-surface-700"
  >
    <!-- Left: Brand mark -->
    <div class="flex items-center gap-1.5">
      <img :src="logoSrc" alt="EVM Mini Wallet" class="h-6 w-6" />
    </div>

    <!-- Center: Account info (when connected) -->
    <div v-if="isConnected" class="flex items-center">
      <AccountInfo />
    </div>

    <!-- Right: Chain selector + Theme toggle -->
    <div class="flex items-center gap-1">
      <ThemeToggle v-if="!isConnected" />
      <template v-else>
        <ChainSelector />
        <ThemeToggle class="hidden sm:flex" />
      </template>
    </div>
  </header>
</template>
