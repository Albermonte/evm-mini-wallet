import { useQuery } from "@tanstack/vue-query";
import { useChainId, useConnection } from "@wagmi/vue";
import { computed, ref, watch, type Ref } from "vue";
import { fetchTokenBalances, type TokenWithBalance } from "../utils/token-balances";
import { getCachedPrices, setCachedPrices } from "../utils/price-cache";
import { calculateFiatValue, fetchTokenPrices } from "../utils/prices";
import { getTokenKey } from "../utils/tokens";

export interface PortfolioToken extends TokenWithBalance {
  fiatPrice: number | null;
  fiatValue: number | null;
}

const trustedTokenKeysByScope = new Map<string, Ref<Set<string>>>();

function getScopeTrustState(scopeKey: string): Ref<Set<string>> {
  const existing = trustedTokenKeysByScope.get(scopeKey);
  if (existing) return existing;

  const trustState = ref(new Set<string>());
  trustedTokenKeysByScope.set(scopeKey, trustState);
  return trustState;
}

export function usePortfolio(options: { vsCurrency?: string } = {}) {
  const { vsCurrency = "usd" } = options;
  const { address } = useConnection();
  const chainId = useChainId();

  const scopeKey = computed(() => {
    if (!chainId.value || !address.value) return "disconnected";
    return `${chainId.value}:${address.value.toLowerCase()}`;
  });

  const scopeTrustState = computed(() => getScopeTrustState(scopeKey.value));

  const balancesQuery = useQuery({
    queryKey: computed(() => ["portfolio-balances", chainId.value ?? null, address.value ?? null]),
    enabled: computed(() => Boolean(chainId.value && address.value)),
    queryFn: async () => {
      if (!chainId.value || !address.value) return [];

      const tokens = await fetchTokenBalances(chainId.value, address.value).catch(() => []);
      return tokens.filter((token) => token.balance > 0n);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  watch(scopeKey, (nextScopeKey, previousScopeKey) => {
    if (!previousScopeKey || nextScopeKey === previousScopeKey) return;
    scopeTrustState.value.value = new Set();
  });

  const tokenBalances = computed(() => balancesQuery.data.value ?? []);

  const trustedTokenKeys = computed(() => {
    const trusted = new Set(scopeTrustState.value.value);

    for (const token of tokenBalances.value) {
      if (token.token.isNative) {
        trusted.add(getTokenKey(token.token));
      }
    }

    return trusted;
  });

  const pricedTokens = computed(() =>
    tokenBalances.value.filter((token) => trustedTokenKeys.value.has(getTokenKey(token.token))),
  );

  const pricesQuery = useQuery({
    queryKey: computed(() => [
      "portfolio-prices",
      chainId.value ?? null,
      vsCurrency,
      pricedTokens.value.map((token) => getTokenKey(token.token)),
    ]),
    enabled: computed(() => Boolean(chainId.value && pricedTokens.value.length > 0)),
    queryFn: async () => {
      if (!chainId.value || pricedTokens.value.length === 0) return {};

      const cached = await getCachedPrices(chainId.value, vsCurrency);
      if (cached) {
        const tokenKeys = pricedTokens.value.map((t) => getTokenKey(t.token));
        if (tokenKeys.every((key) => key in cached)) return cached;
      }

      const fresh = await fetchTokenPrices(
        chainId.value,
        pricedTokens.value.map((token) => token.token),
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
      const tokenKey = getTokenKey(token.token);
      const fiatPrice = prices[tokenKey] ?? null;

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
    let total = 0;
    let hasTrustedPricedAsset = false;

    for (const token of tokens.value) {
      const tokenKey = getTokenKey(token.token);
      if (!trustedTokenKeys.value.has(tokenKey) || token.fiatValue === null) continue;

      total += token.fiatValue;
      hasTrustedPricedAsset = true;
    }

    return hasTrustedPricedAsset ? total : null;
  });

  function markTokenTrusted(tokenKey: string) {
    if (scopeTrustState.value.value.has(tokenKey)) return;
    scopeTrustState.value.value.add(tokenKey);
    scopeTrustState.value.value = new Set(scopeTrustState.value.value);
  }

  return {
    isLoading: computed(
      () =>
        balancesQuery.isPending.value ||
        (pricedTokens.value.length > 0 && pricesQuery.isPending.value),
    ),
    markTokenTrusted,
    portfolioTotalFiat,
    scopeKey,
    tokens,
    trustedTokenKeys,
  };
}
