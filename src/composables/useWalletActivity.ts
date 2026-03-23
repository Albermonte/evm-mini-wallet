import { useQuery } from "@tanstack/vue-query";
import { useChainId, useConnection } from "@wagmi/vue";
import { computed } from "vue";
import { fetchBlockscoutTransactions } from "../utils/blockscout";
import { UnsupportedChainFeatureError } from "../utils/errors";
import { QUERY_KEYS } from "../utils/query-keys";

export function useWalletActivity() {
  const { address } = useConnection();
  const chainId = useChainId();

  const query = useQuery({
    queryKey: computed(() => [
      QUERY_KEYS.walletActivity,
      chainId.value ?? null,
      address.value ?? null,
    ]),
    enabled: computed(() => Boolean(chainId.value && address.value)),
    retry: false,
    queryFn: async () => {
      if (!chainId.value || !address.value) return [];
      return fetchBlockscoutTransactions(chainId.value, address.value);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const status = computed(() => {
    if (!chainId.value || !address.value) return "idle";
    if (query.isPending.value) return "loading";
    if (query.error.value instanceof UnsupportedChainFeatureError) return "unsupported";
    if (query.error.value) return "error";
    return "success";
  });

  return {
    transactions: computed(() => query.data.value ?? []),
    status,
    error: computed(() => (query.error.value instanceof Error ? query.error.value : null)),
    isLoading: computed(() => status.value === "loading"),
    isUnsupported: computed(() => status.value === "unsupported"),
    refetch: query.refetch,
  };
}
