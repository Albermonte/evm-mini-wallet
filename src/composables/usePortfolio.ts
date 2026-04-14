import { useQuery } from "@tanstack/vue-query";
import { useChainId, useConnection } from "@wagmi/vue";
import { computed } from "vue";
import type { TokenWithBalance } from "../utils/token-balances";
import { getCachedPrices, setCachedPrices } from "../utils/price-cache";
import { calculateFiatValue, fetchTokenPrices } from "../utils/prices";
import { getChainCapabilities } from "../utils/chains";
import { getTokenKey } from "../utils/tokens";
import { QUERY_KEYS } from "../utils/query-keys";
import { useWalletTokens } from "./useWalletTokens";

export interface PortfolioToken extends TokenWithBalance {
  fiatPrice: number | null;
  fiatValue: number | null;
}

export function usePortfolio(options: { vsCurrency?: string } = {}) {
  const { vsCurrency = "usd" } = options;
  const { address } = useConnection();
  const chainId = useChainId();
  const walletTokens = useWalletTokens();

  const scopeKey = computed(() => {
    if (!chainId.value || !address.value) return "disconnected";
    return `${chainId.value}:${address.value.toLowerCase()}`;
  });
  const tokenBalances = walletTokens.tokens;

  const pricesQuery = useQuery({
    queryKey: computed(() => [
      QUERY_KEYS.portfolioPrices,
      chainId.value ?? null,
      vsCurrency,
      tokenBalances.value.map((token) => getTokenKey(token.token)),
    ]),
    enabled: computed(() =>
      Boolean(
        chainId.value &&
        tokenBalances.value.length > 0 &&
        getChainCapabilities(chainId.value).pricing,
      ),
    ),
    queryFn: async () => {
      if (!chainId.value || tokenBalances.value.length === 0) return {};

      const cached = await getCachedPrices(chainId.value, vsCurrency);
      if (cached) {
        const tokenKeys = tokenBalances.value.map((t) => getTokenKey(t.token));
        const hasCompleteCachedPrices = tokenKeys.every(
          (key) => key in cached && cached[key] !== null,
        );
        if (hasCompleteCachedPrices) return cached;
      }

      const fresh = await fetchTokenPrices(
        chainId.value,
        tokenBalances.value.map((token) => token.token),
        vsCurrency,
      );
      await setCachedPrices(chainId.value, vsCurrency, fresh);
      return fresh;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const tokens = computed(() => {
    const prices = pricesQuery.data.value ?? {};

    const mapped = tokenBalances.value.map<PortfolioToken>((token) => {
      const fiatPrice = prices[getTokenKey(token.token)] ?? null;

      return {
        ...token,
        fiatPrice,
        fiatValue: calculateFiatValue(token.balance, token.token.decimals, fiatPrice),
      };
    });

    return mapped.sort((a, b) => {
      if (a.token.isNative !== b.token.isNative) return a.token.isNative ? -1 : 1;
      if (a.fiatValue !== null && b.fiatValue !== null) return b.fiatValue - a.fiatValue;
      if (a.fiatValue !== null) return -1;
      if (b.fiatValue !== null) return 1;
      return 0;
    });
  });

  const portfolioTotalFiat = computed(() => {
    if (walletTokens.status.value !== "success") return null;
    if (tokens.value.length === 0) return 0;

    let total = 0;
    let hasPricedAsset = false;

    for (const token of tokens.value) {
      if (token.fiatValue === null) continue;

      total += token.fiatValue;
      hasPricedAsset = true;
    }

    return hasPricedAsset ? total : null;
  });

  return {
    isLoading: computed(
      () =>
        walletTokens.isLoading.value ||
        (tokenBalances.value.length > 0 && pricesQuery.isPending.value),
    ),
    status: walletTokens.status,
    error: walletTokens.error,
    portfolioTotalFiat,
    hasKnownTotal: computed(() => portfolioTotalFiat.value !== null),
    scopeKey,
    refetch: walletTokens.refetch,
    tokens,
  };
}
