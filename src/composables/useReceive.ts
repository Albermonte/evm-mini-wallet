import { computed } from "vue";
import { useConnection } from "@wagmi/vue";
import { useClipboard } from "./useClipboard";
import { useToast } from "./useToast";

export function useReceive() {
  const { address } = useConnection();
  const { copied, copy } = useClipboard();
  const { addToast } = useToast();

  const qrValue = computed(() => (address.value ? `ethereum:${address.value}` : ""));

  async function copyAddress() {
    if (!address.value) return;
    await copy(address.value);
    addToast("Address copied", "success");
  }

  return {
    address,
    copied,
    qrValue,
    copyAddress,
  };
}
