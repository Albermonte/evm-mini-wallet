import { type Address, createPublicClient, http } from "viem";
import type { Erc20TokenInfo, TokenInfo } from "./tokens";
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

// --- Blockscout token discovery ---

const blockscoutApiUrls: Record<number, string> = {
  1: "https://eth.blockscout.com",
  137: "https://polygon.blockscout.com",
  42161: "https://arbitrum.blockscout.com",
  10: "https://optimism.blockscout.com",
  8453: "https://base.blockscout.com",
  11155111: "https://eth-sepolia.blockscout.com",
};

interface BlockscoutTokenItem {
  token: {
    address_hash: string;
    name: string;
    symbol: string;
    decimals: string;
    icon_url: string | null;
    type: string;
  };
}

interface BlockscoutDiscoveryResponse {
  items: BlockscoutTokenItem[];
}

async function discoverTokens(chainId: number, address: Address): Promise<Erc20TokenInfo[]> {
  const baseUrl = blockscoutApiUrls[chainId];
  if (!baseUrl) return [];

  const response = await fetch(`${baseUrl}/api/v2/addresses/${address}/tokens?type=ERC-20`);
  if (!response.ok) return [];

  const data: BlockscoutDiscoveryResponse = await response.json();
  return data.items
    .filter((item) => item.token.type === "ERC-20")
    .map((item) => ({
      address: item.token.address_hash as Address,
      symbol: item.token.symbol,
      name: item.token.name,
      decimals: Number(item.token.decimals),
    }));
}

// --- Balance fetching ---

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

function mergeTokenLists(
  wellKnown: Erc20TokenInfo[],
  discovered: Erc20TokenInfo[],
): Erc20TokenInfo[] {
  const seen = new Set(wellKnown.map((t) => t.address.toLowerCase()));
  const merged = [...wellKnown];
  for (const token of discovered) {
    if (!seen.has(token.address.toLowerCase())) {
      merged.push(token);
    }
  }
  return merged;
}

async function fetchErc20Balances(
  chainId: number,
  address: Address,
  tokens: Erc20TokenInfo[],
): Promise<TokenWithBalance[]> {
  const meta = chainMeta[chainId];
  if (!meta || tokens.length === 0) return [];

  const client = createPublicClient({ chain: meta.chain, transport: http() });
  const results = await client.multicall({
    contracts: tokens.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address],
    })),
  });

  const balances: TokenWithBalance[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const res = results[i];
    if (res?.status !== "success") continue;
    const balance = res.result as bigint;
    if (balance <= 0n) continue;

    const token = tokens[i]!;
    balances.push({
      token,
      balance,
      logoUrls: getTokenLogoUrls(chainId, token.address),
    });
  }

  return balances;
}

export function fetchTokenBalances(chainId: number, address: Address): Promise<TokenWithBalance[]> {
  const key = getCacheKey(chainId, address);

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return Promise.resolve(cached.data);

  const inflight = pending.get(key);
  if (inflight) return inflight;

  const request = (async () => {
    try {
      const meta = chainMeta[chainId];
      if (!meta) return [];

      const known = wellKnownTokens[chainId] ?? [];

      // Discover tokens via Blockscout in parallel with native balance
      const [nativeToken, discovered] = await Promise.all([
        fetchNativeTokenBalance(chainId, address).catch(() => null),
        discoverTokens(chainId, address).catch(() => [] as Erc20TokenInfo[]),
      ]);

      const allTokens = mergeTokenLists(known, discovered);

      const erc20Balances = await fetchErc20Balances(chainId, address, allTokens);

      const data: TokenWithBalance[] = [];
      if (nativeToken) data.push(nativeToken);
      data.push(...erc20Balances);

      cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch {
      return [];
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, request);
  return request;
}
