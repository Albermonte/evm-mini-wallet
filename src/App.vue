<script setup lang="ts">
import { ref } from "vue";
import { useConnection } from "@wagmi/vue";
import { useQueryClient } from "@tanstack/vue-query";
import { invalidateWalletQueries } from "./utils/query-keys";
import {
  ToastProvider,
  TooltipProvider,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "reka-ui";
import { ArrowUpRight } from "lucide-vue-next";
import { Motion } from "motion-v";
import AppHeader from "./components/layout/AppHeader.vue";
import ConnectWallet from "./components/wallet/ConnectWallet.vue";
import BalanceDisplay from "./components/wallet/BalanceDisplay.vue";
import TokenList from "./components/wallet/TokenList.vue";
import ReceiveSheet from "./components/wallet/ReceiveSheet.vue";
import SendTransaction from "./components/actions/SendTransaction.vue";
import TransactionList from "./components/actions/TransactionList.vue";
import BaseModal from "./components/ui/BaseModal.vue";
import Toast from "./components/ui/Toast.vue";
import SettingsButton from "./components/ui/SettingsButton.vue";
import { usePullToRefresh } from "./composables/usePullToRefresh";

const { isConnected } = useConnection();
const showReceive = ref(false);
const showSend = ref(false);
const activeTab = ref("tokens");

const scrollContainer = ref<HTMLElement | null>(null);
const queryClient = useQueryClient();

const { pullDistance, isRefreshing, isPulling } = usePullToRefresh({
  scrollTarget: scrollContainer,
  async onRefresh() {
    await invalidateWalletQueries(queryClient);
  },
});
</script>

<template>
  <ToastProvider swipe-direction="up">
    <TooltipProvider :delay-duration="300">
      <div
        data-testid="app-shell"
        class="flex h-dvh min-h-svh box-border flex-col overflow-hidden"
        style="
          padding-top: env(safe-area-inset-top);
          padding-right: env(safe-area-inset-right);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
        "
      >
        <AppHeader @open-receive="showReceive = true" />

        <main
          ref="scrollContainer"
          data-testid="app-main"
          class="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <Transition name="fade" mode="out-in">
            <ConnectWallet v-if="!isConnected" />

            <div v-else class="mx-auto flex w-full max-w-lg flex-col px-4 sm:px-5">
              <!-- Pull-to-refresh indicator -->
              <div
                class="flex items-center justify-center overflow-hidden"
                :class="{ 'transition-[height] duration-300 ease-out': !isPulling }"
                :style="{ height: `${pullDistance}px` }"
              >
                <div
                  v-if="pullDistance > 0 || isRefreshing"
                  class="flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-black dark:text-white"
                    :class="{ 'animate-spin': isRefreshing }"
                    :style="
                      !isRefreshing
                        ? {
                            transform: `rotate(${Math.min(pullDistance / 80, 1) * 360}deg)`,
                            opacity: Math.min(pullDistance / 40, 1),
                          }
                        : undefined
                    "
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
              </div>

              <!-- Hero Balance (dominant, breathing room) -->
              <Motion
                class="flex flex-col items-center pt-10 pb-8 sm:pt-14 sm:pb-10"
                :initial="{ opacity: 0, y: 20 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }"
              >
                <BalanceDisplay />
              </Motion>

              <!-- Send Action (primary, commanding) -->
              <Motion
                class="mx-4 pb-12 sm:mx-6 sm:pb-14"
                :initial="{ opacity: 0, y: 16 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }"
              >
                <button
                  class="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-black py-4 text-base font-bold tracking-tight text-white transition-all duration-150 active:scale-[0.98] dark:bg-white dark:text-black"
                  @click="showSend = true"
                >
                  <ArrowUpRight
                    class="h-5 w-5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                  Send
                </button>
              </Motion>

              <!-- Tabs: Tokens / Activity (clear break from hero) -->
              <Motion
                :initial="{ opacity: 0, y: 20 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }"
              >
                <TabsRoot v-model="activeTab" class="pb-10">
                  <TabsList
                    class="relative mb-5 flex border-b border-surface-200 dark:border-surface-800"
                  >
                    <TabsTrigger
                      value="tokens"
                      class="flex-1 px-4 py-2.5 text-sm font-bold text-surface-400 transition-colors data-[state=active]:text-black dark:text-surface-500 dark:data-[state=active]:text-white"
                    >
                      Tokens
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      class="flex-1 px-4 py-2.5 text-sm font-bold text-surface-400 transition-colors data-[state=active]:text-black dark:text-surface-500 dark:data-[state=active]:text-white"
                    >
                      Activity
                    </TabsTrigger>
                    <div
                      class="absolute bottom-0 left-0 h-[3px] w-1/2 bg-black transition-transform duration-300 dark:bg-white"
                      :style="{
                        transform: activeTab === 'tokens' ? 'translateX(0)' : 'translateX(100%)',
                        transitionTimingFunction: 'var(--ease-out-expo)',
                      }"
                    />
                  </TabsList>

                  <TabsContent value="tokens" class="tab-content focus:outline-none">
                    <TokenList />
                  </TabsContent>
                  <TabsContent value="activity" class="tab-content focus:outline-none">
                    <TransactionList />
                  </TabsContent>
                </TabsRoot>
              </Motion>
            </div>
          </Transition>
        </main>
      </div>

      <BaseModal v-model="showReceive" title="Receive" description="Receive funds into this wallet">
        <ReceiveSheet />
      </BaseModal>

      <!-- Send Sheet -->
      <BaseModal v-model="showSend" title="Send" description="Send a transaction">
        <SendTransaction />
      </BaseModal>

      <SettingsButton />
      <Toast />
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

.tab-content[data-state="active"] {
  animation: tabContentIn 200ms ease;
}
@keyframes tabContentIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>
