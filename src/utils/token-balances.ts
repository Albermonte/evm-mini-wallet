import { type Address, createPublicClient, http } from "viem";
import type { TokenInfo } from "./tokens";
import { erc20Abi } from "./tokens";
import { getNativeTokenLogoUrls, getTokenLogoUrls } from "./token-logos";
import { chainMeta } from "./chains";
import { wellKnownTokens } from "./well-known-tokens";

const CACHE_TTL = 30_000; // 30s — balances change, so keep it short

export interface TokenWithBalance {
  token: TokenInfo;
  balance: bigint;
  logoUrls: string[];
}

const cache = new Map<string, { data: TokenWithBalance[]; timestamp: number }>();
const pending = new Map<string, Promise<TokenWithBalance[]>>();

export function clearTokenCache() {
  cache.clear();
}

function getCacheKey(chainId: number, address: string): string {
  return `${chainId}:${address.toLowerCase()}`;
}

async function fetchNativeTokenBalance(
  chainId: number,
  address: Address,
): Promise<TokenWithBalance | null> {
  const meta = chainMeta[chainId];
  if (!meta) return null;

  const client = createPublicClient({ chain: meta.chain, transport: http() });
  const balance = await client.getBalance({ address });
  if (balance <= 0n) return null;

  return {
    token: {
      address: null,
      symbol: meta.chain.nativeCurrency.symbol,
      name: meta.chain.nativeCurrency.name,
      decimals: meta.chain.nativeCurrency.decimals,
      isNative: true,
    },
    balance,
    logoUrls: getNativeTokenLogoUrls(chainId),
  };
}

export function fetchTokenBalances(chainId: number, address: Address): Promise<TokenWithBalance[]> {
  const key = getCacheKey(chainId, address);

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return Promise.resolve(cached.data);

  const inflight = pending.get(key);
  if (inflight) return inflight;

  const request = (async () => {
    try {
      const tokens = wellKnownTokens[chainId];
      const meta = chainMeta[chainId];
      if (!meta) return [];

      const client = createPublicClient({ chain: meta.chain, transport: http() });
      const nativeTokenPromise = fetchNativeTokenBalance(chainId, address).catch(() => null);

      if (!tokens?.length) {
        const nativeToken = await nativeTokenPromise;
        const data = nativeToken ? [nativeToken] : [];
        cache.set(key, { data, timestamp: Date.now() });
        return data;
      }

      const [nativeToken, results] = await Promise.all([
        nativeTokenPromise,
        client.multicall({
          contracts: tokens.map((token) => ({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf" as const,
            args: [address],
          })),
        }),
      ]);

      const tokenBalances: TokenWithBalance[] = [];
      if (nativeToken) {
        tokenBalances.push(nativeToken);
      }

      for (let i = 0; i < tokens.length; i++) {
        const res = results[i];
        if (res?.status !== "success") continue;
        const balance = res.result as bigint;
        if (balance <= 0n) continue;

        const token = tokens[i]!;
        tokenBalances.push({
          token,
          balance,
          logoUrls: getTokenLogoUrls(chainId, token.address),
        });
      }

      cache.set(key, { data: tokenBalances, timestamp: Date.now() });
      return tokenBalances;
    } catch {
      return [];
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, request);
  return request;
}
