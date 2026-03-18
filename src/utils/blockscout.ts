import { type Address, createPublicClient, http } from "viem";
import type { TokenInfo } from "./tokens";
import { erc20Abi } from "./tokens";
import { getTokenLogoUrls } from "./token-logos";
import { chainMeta } from "./chains";
import { wellKnownTokens } from "./well-known-tokens";

const CACHE_TTL = 30_000; // 30s — balances change, so keep it short

const blockscoutApiUrls: Record<number, string> = {
  1: "https://eth.blockscout.com",
  137: "https://polygon.blockscout.com",
  42161: "https://arbitrum.blockscout.com",
  10: "https://optimism.blockscout.com",
  8453: "https://base.blockscout.com",
  11155111: "https://eth-sepolia.blockscout.com",
  // BSC (56) has no Blockscout instance
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
  value: string;
}

interface BlockscoutResponse {
  items: BlockscoutTokenItem[];
  next_page_params: Record<string, string> | null;
}

export interface TokenWithBalance {
  token: TokenInfo;
  balance: bigint;
  logoUrls: string[];
}

interface CacheEntry {
  data: TokenWithBalance[];
  timestamp: number;
}

const tokenCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<TokenWithBalance[]>>();

function getCacheKey(chainId: number, address: string): string {
  return `${chainId}:${address.toLowerCase()}`;
}

async function fetchTokensViaRpc(chainId: number, address: Address): Promise<TokenWithBalance[]> {
  const tokens = wellKnownTokens[chainId];
  if (!tokens?.length) return [];

  const meta = chainMeta[chainId];
  if (!meta) return [];

  const client = createPublicClient({ chain: meta.chain, transport: http() });

  const results = await client.multicall({
    contracts: tokens.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address],
    })),
  });

  const tokenBalances: TokenWithBalance[] = [];
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

  return tokenBalances;
}

export async function fetchBlockscoutTokens(
  chainId: number,
  address: Address,
): Promise<TokenWithBalance[]> {
  const key = getCacheKey(chainId, address);

  // Return cached data if fresh
  const cached = tokenCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Deduplicate in-flight requests
  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      // Try Blockscout API first
      const baseUrl = blockscoutApiUrls[chainId];
      if (!baseUrl) {
        // No Blockscout instance (e.g. BSC) — go straight to RPC
        const result = await fetchTokensViaRpc(chainId, address);
        tokenCache.set(key, { data: result, timestamp: Date.now() });
        return result;
      }

      const response = await fetch(`${baseUrl}/api/v2/addresses/${address}/tokens?type=ERC-20`);
      if (!response.ok) throw new Error(`Blockscout returned ${response.status}`);

      const data: BlockscoutResponse = await response.json();

      const result = data.items
        .filter((item) => item.token.type === "ERC-20")
        .map((item) => {
          const tokenAddress = item.token.address_hash as Address;
          // Construct direct logo URLs (no API calls) + Blockscout's icon as fallback
          const logoUrls = getTokenLogoUrls(chainId, tokenAddress);
          if (item.token.icon_url) {
            logoUrls.push(item.token.icon_url);
          }
          return {
            token: {
              address: tokenAddress,
              symbol: item.token.symbol,
              name: item.token.name,
              decimals: Number(item.token.decimals),
            },
            balance: BigInt(item.value),
            logoUrls,
          };
        });

      tokenCache.set(key, { data: result, timestamp: Date.now() });
      return result;
    } catch {
      // API failed — fall back to RPC with well-known token list
      try {
        const result = await fetchTokensViaRpc(chainId, address);
        tokenCache.set(key, { data: result, timestamp: Date.now() });
        return result;
      } catch {
        return [];
      }
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, request);
  return request;
}

// --- Transaction history ---

export interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  status: "ok" | "error" | null;
  timestamp: string;
  method: string | null;
  fee: string;
  toName: string | null;
  toIsContract: boolean;
  transactionTypes: string[];
  protocol: string | null;
}

interface BlockscoutAddressInfo {
  hash: string;
  name: string | null;
  is_contract: boolean;
  metadata: {
    tags: { name: string; tagType: string }[];
  } | null;
}

interface BlockscoutTxItem {
  hash: string;
  from: BlockscoutAddressInfo;
  to: BlockscoutAddressInfo | null;
  value: string;
  status: "ok" | "error" | null;
  timestamp: string;
  method: string | null;
  fee: { value: string };
  transaction_types: string[];
}

interface BlockscoutTxResponse {
  items: BlockscoutTxItem[];
  next_page_params: Record<string, string> | null;
}

function extractProtocol(info: BlockscoutAddressInfo | null): string | null {
  if (!info?.metadata?.tags) return null;
  const protocolTag = info.metadata.tags.find((t) => t.tagType === "protocol");
  return protocolTag?.name ?? null;
}

const txCache = new Map<string, { data: Transaction[]; timestamp: number }>();
const pendingTxRequests = new Map<string, Promise<Transaction[]>>();

export async function fetchBlockscoutTransactions(
  chainId: number,
  address: Address,
): Promise<Transaction[]> {
  const baseUrl = blockscoutApiUrls[chainId];
  if (!baseUrl) return [];

  const key = `tx:${getCacheKey(chainId, address)}`;

  const cached = txCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const pending = pendingTxRequests.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v2/addresses/${address}/transactions`);
      if (!response.ok) return [];

      const data: BlockscoutTxResponse = await response.json();

      const result: Transaction[] = data.items.map((item) => ({
        hash: item.hash,
        from: item.from.hash,
        to: item.to?.hash ?? null,
        value: item.value,
        status: item.status,
        timestamp: item.timestamp,
        method: item.method,
        fee: item.fee.value,
        toName: item.to?.name ?? null,
        toIsContract: item.to?.is_contract ?? false,
        transactionTypes: item.transaction_types,
        protocol: extractProtocol(item.to),
      }));

      txCache.set(key, { data: result, timestamp: Date.now() });
      return result;
    } catch {
      return [];
    } finally {
      pendingTxRequests.delete(key);
    }
  })();

  pendingTxRequests.set(key, request);
  return request;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const meta = chainMeta[chainId];
  if (!meta) return "";
  return `${meta.explorerUrl}/address/${address}`;
}
