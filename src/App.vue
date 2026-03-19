<script setup lang="ts">
import { ref } from "vue";
import { useConnection } from "@wagmi/vue";
import {
  ToastProvider,
  TooltipProvider,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "reka-ui";
import { ArrowUpRight, X } from "lucide-vue-next";
import { Motion } from "motion-v";
import AppHeader from "./components/layout/AppHeader.vue";
import ConnectWallet from "./components/wallet/ConnectWallet.vue";
import BalanceDisplay from "./components/wallet/BalanceDisplay.vue";
import TokenList from "./components/wallet/TokenList.vue";
import SendTransaction from "./components/actions/SendTransaction.vue";
import TransactionList from "./components/actions/TransactionList.vue";
import Toast from "./components/ui/Toast.vue";
import SettingsButton from "./components/ui/SettingsButton.vue";

const { isConnected } = useConnection();
const showSend = ref(false);
const activeTab = ref("tokens");
</script>

<template>
  <ToastProvider swipe-direction="down">
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

            <div v-else class="mx-auto flex w-full max-w-lg flex-col px-4 sm:px-5">
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
                        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
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

        <!-- Send Sheet -->
        <DialogRoot v-model:open="showSend">
          <DialogPortal>
            <DialogOverlay class="send-overlay fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
            <DialogContent
              class="send-sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-surface-200 bg-white px-5 pb-8 pt-3 shadow-2xl sm:px-6 dark:border-surface-700 dark:bg-surface-900"
            >
              <div class="mb-3 flex justify-center">
                <div class="h-1.5 w-12 rounded-full bg-surface-300 dark:bg-surface-600" />
              </div>
              <div class="mb-5 flex items-center justify-between">
                <DialogTitle class="text-lg font-bold text-surface-900 dark:text-surface-100">
                  Send
                </DialogTitle>
                <DialogDescription class="sr-only"> Send a transaction </DialogDescription>
                <DialogClose
                  aria-label="Close"
                  class="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                >
                  <X class="h-5 w-5" />
                </DialogClose>
              </div>
              <SendTransaction />
            </DialogContent>
          </DialogPortal>
        </DialogRoot>

        <SettingsButton />
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

.send-overlay {
  animation: overlayShow 250ms ease-out;
}
.send-overlay[data-state="closed"] {
  animation: overlayHide 150ms ease forwards;
}
.send-sheet {
  animation: sheetSlideUp 400ms cubic-bezier(0.32, 0.72, 0, 1);
}
.send-sheet[data-state="closed"] {
  animation: sheetSlideDown 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes overlayShow {
  from {
    opacity: 0;
  }
}
@keyframes overlayHide {
  to {
    opacity: 0;
  }
}
@keyframes sheetSlideUp {
  from {
    transform: translateY(100%);
  }
}
@keyframes sheetSlideDown {
  to {
    transform: translateY(100%);
  }
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
