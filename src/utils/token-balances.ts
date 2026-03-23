import { type Address, type PublicClient, createPublicClient, http } from "viem";
import type { Erc20TokenInfo, TokenInfo } from "./tokens";
import { erc20Abi } from "./tokens";
import { getNativeTokenLogoUrls, getTokenLogoUrls } from "./token-logos";
import { chainMeta, getChainCapabilities } from "./chains";
import { wellKnownTokens } from "./well-known-tokens";
import { blockscoutApiUrls } from "./blockscout";

export interface TokenWithBalance {
  token: TokenInfo;
  balance: bigint;
  logoUrls: string[];
}

const clientCache = new Map<number, PublicClient>();

function getPublicClient(chainId: number): PublicClient | null {
  const meta = chainMeta[chainId];
  if (!meta) return null;

  let client = clientCache.get(chainId);
  if (!client) {
    client = createPublicClient({ chain: meta.chain, transport: http() });
    clientCache.set(chainId, client);
  }
  return client;
}

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
  if (!getChainCapabilities(chainId).tokenDiscovery) return [];

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
      source: "discovered",
      verification: "unverified",
    }));
}

// --- Balance fetching ---

async function fetchNativeTokenBalance(
  chainId: number,
  address: Address,
): Promise<TokenWithBalance | null> {
  const meta = chainMeta[chainId];
  if (!meta) return null;

  const client = getPublicClient(chainId);
  if (!client) return null;
  const balance = await client.getBalance({ address });
  if (balance <= 0n) return null;

  return {
    token: {
      address: null,
      symbol: meta.chain.nativeCurrency.symbol,
      name: meta.chain.nativeCurrency.name,
      decimals: meta.chain.nativeCurrency.decimals,
      isNative: true,
      source: "native",
      verification: "verified",
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
  const merged: Erc20TokenInfo[] = wellKnown.map((token) => ({
    ...token,
    source: token.source ?? "curated",
    verification: token.verification ?? "unverified",
  }));
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
  if (tokens.length === 0) return [];

  const client = getPublicClient(chainId);
  if (!client) return [];
  const results = await client.multicall({
    contracts: tokens.flatMap((token) => [
      {
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: [address],
      },
      {
        address: token.address,
        abi: erc20Abi,
        functionName: "name" as const,
      },
      {
        address: token.address,
        abi: erc20Abi,
        functionName: "symbol" as const,
      },
      {
        address: token.address,
        abi: erc20Abi,
        functionName: "decimals" as const,
      },
    ]),
  });

  const balances: TokenWithBalance[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const resultOffset = i * 4;
    const balanceResult = results[resultOffset];
    if (balanceResult?.status !== "success") continue;

    const balance = balanceResult.result as bigint;
    if (balance <= 0n) continue;

    const token = tokens[i]!;
    const nameResult = results[resultOffset + 1];
    const symbolResult = results[resultOffset + 2];
    const decimalsResult = results[resultOffset + 3];

    const verifiedName = nameResult?.status === "success" ? String(nameResult.result) : token.name;
    const verifiedSymbol =
      symbolResult?.status === "success" ? String(symbolResult.result) : token.symbol;
    const verifiedDecimals =
      decimalsResult?.status === "success" ? Number(decimalsResult.result) : token.decimals;
    const verification =
      nameResult?.status === "success" &&
      symbolResult?.status === "success" &&
      decimalsResult?.status === "success"
        ? "verified"
        : "unverified";

    balances.push({
      token: {
        ...token,
        name: verifiedName,
        symbol: verifiedSymbol,
        decimals: verifiedDecimals,
        source: token.source ?? "curated",
        verification,
      },
      balance,
      logoUrls: getTokenLogoUrls(chainId, token.address),
    });
  }

  return balances;
}

export function fetchTokenBalances(chainId: number, address: Address): Promise<TokenWithBalance[]> {
  return (async () => {
    const meta = chainMeta[chainId];
    if (!meta) return [];

    const known = wellKnownTokens[chainId] ?? [];

    const [nativeToken, discovered] = await Promise.all([
      fetchNativeTokenBalance(chainId, address),
      discoverTokens(chainId, address).catch(() => [] as Erc20TokenInfo[]),
    ]);

    const allTokens = mergeTokenLists(known, discovered);
    const erc20Balances = await fetchErc20Balances(chainId, address, allTokens);

    const data: TokenWithBalance[] = [];
    if (nativeToken) data.push(nativeToken);
    data.push(...erc20Balances);
    return data;
  })();
}
