import { ref, watch, type WatchCallback } from "vue";

/** Incremented each time a transaction is confirmed. */
const txConfirmedCount = ref(0);

/** Signal that a transaction has been confirmed so other components can refetch. */
export function notifyTransactionConfirmed() {
  txConfirmedCount.value++;
}

/** Run a callback whenever a transaction is confirmed. */
export function onTransactionConfirmed(callback: WatchCallback<number>) {
  watch(txConfirmedCount, callback);
}
