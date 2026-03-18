<script setup lang="ts">
import { useConnection } from "@wagmi/vue";
import ThemeToggle from "../ui/ThemeToggle.vue";
import ChainSelector from "../wallet/ChainSelector.vue";
import AccountInfo from "../wallet/AccountInfo.vue";

const { isConnected } = useConnection();
</script>

<template>
  <header
    class="flex items-center justify-between border-b border-surface-200 px-3 py-2.5 sm:px-4 sm:py-3 dark:border-surface-800"
  >
    <!-- Left: Theme toggle -->
    <div class="flex items-center">
      <ThemeToggle />
    </div>

    <!-- Center: Account info (when connected) -->
    <div v-if="isConnected" class="flex items-center">
      <AccountInfo />
    </div>

    <!-- Right: Chain selector (when connected) -->
    <div class="flex items-center">
      <ChainSelector v-if="isConnected" />
    </div>
  </header>
</template>
