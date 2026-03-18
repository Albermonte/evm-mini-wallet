import { shallowRef, onMounted, onUnmounted } from "vue";
import type { EIP1193Provider } from "viem";

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<EIP6963ProviderDetail>;
  }
}

export function useEip6963Providers() {
  const providers = shallowRef<EIP6963ProviderDetail[]>([]);

  function handleAnnouncement(event: CustomEvent<EIP6963ProviderDetail>) {
    const { info, provider } = event.detail;
    if (providers.value.some((p) => p.info.uuid === info.uuid)) return;
    providers.value = [...providers.value, { info, provider }];
  }

  onMounted(() => {
    window.addEventListener("eip6963:announceProvider", handleAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  });

  onUnmounted(() => {
    window.removeEventListener("eip6963:announceProvider", handleAnnouncement);
  });

  return { providers };
}
