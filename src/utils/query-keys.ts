import type { QueryClient } from "@tanstack/vue-query";

export const QUERY_KEYS = {
  walletTokens: "wallet-tokens",
  walletActivity: "wallet-activity",
  portfolioPrices: "portfolio-prices",
} as const;

export function invalidateWalletQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.walletTokens] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.walletActivity] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.portfolioPrices] }),
  ]);
}
