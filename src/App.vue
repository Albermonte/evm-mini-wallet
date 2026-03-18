<script setup lang="ts">
import { useConnection } from "@wagmi/vue";
import { ToastProvider, TooltipProvider } from "reka-ui";
import AppHeader from "./components/layout/AppHeader.vue";
import ConnectWallet from "./components/wallet/ConnectWallet.vue";
import BalanceDisplay from "./components/wallet/BalanceDisplay.vue";
import TokenList from "./components/wallet/TokenList.vue";
import SendTransaction from "./components/actions/SendTransaction.vue";
import TransactionList from "./components/actions/TransactionList.vue";
import Toast from "./components/ui/Toast.vue";

const { isConnected } = useConnection();
</script>

<template>
  <ToastProvider swipe-direction="right">
    <TooltipProvider :delay-duration="300">
      <div
        class="flex min-h-svh flex-col"
        style="
          padding-top: env(safe-area-inset-top);
          padding-right: env(safe-area-inset-right);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
        "
      >
        <AppHeader />

        <main class="flex flex-1 flex-col">
          <Transition name="fade" mode="out-in">
            <ConnectWallet v-if="!isConnected" />

            <div
              v-else
              class="mx-auto flex w-full max-w-lg flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6"
            >
              <BalanceDisplay />
              <TokenList />
              <SendTransaction />
              <TransactionList />
            </div>
          </Transition>
        </main>
        <Toast />
      </div>
    </TooltipProvider>
  </ToastProvider>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
