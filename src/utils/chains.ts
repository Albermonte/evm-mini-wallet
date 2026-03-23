import type { Chain } from "@wagmi/vue/chains";
import { mainnet, polygon, arbitrum, optimism, base, bsc, sepolia } from "@wagmi/vue/chains";
import { getChainLogoUrl } from "./token-logos";

interface ChainMeta {
  chain: Chain;
  color: string;
  explorerUrl: string;
  logo: string;
  capabilities: {
    balances: boolean;
    tokenDiscovery: boolean;
    activity: boolean;
    pricing: boolean;
  };
}

export const chainMeta: Record<number, ChainMeta> = {
  [mainnet.id]: {
    chain: mainnet,
    color: "#627EEA",
    explorerUrl: "https://etherscan.io",
    logo: getChainLogoUrl(mainnet.id)!,
    capabilities: {
      balances: true,
      tokenDiscovery: true,
      activity: true,
      pricing: true,
    },
  },
  [polygon.id]: {
    chain: polygon,
    color: "#8247E5",
    explorerUrl: "https://polygonscan.com",
    logo: getChainLogoUrl(polygon.id)!,
    capabilities: {
      balances: true,
      tokenDiscovery: true,
      activity: true,
      pricing: true,
    },
  },
  [arbitrum.id]: {
    chain: arbitrum,
    color: "#28A0F0",
    explorerUrl: "https://arbiscan.io",
    logo: getChainLogoUrl(arbitrum.id)!,
    capabilities: {
      balances: true,
      tokenDiscovery: true,
      activity: true,
      pricing: true,
    },
  },
  [optimism.id]: {
    chain: optimism,
    color: "#FF0420",
    explorerUrl: "https://optimistic.etherscan.io",
    logo: getChainLogoUrl(optimism.id)!,
    capabilities: {
      balances: true,
      tokenDiscovery: true,
      activity: true,
      pricing: true,
    },
  },
  [base.id]: {
    chain: base,
    color: "#0052FF",
    explorerUrl: "https://basescan.org",
    logo: getChainLogoUrl(base.id)!,
    capabilities: {
      balances: true,
      tokenDiscovery: true,
      activity: true,
      pricing: true,
    },
  },
  [bsc.id]: {
    chain: bsc,
    color: "#F0B90B",
    explorerUrl: "https://bscscan.com",
    logo: getChainLogoUrl(bsc.id)!,
    capabilities: {
      balances: true,
      tokenDiscovery: false,
      activity: false,
      pricing: true,
    },
  },
  [sepolia.id]: {
    chain: sepolia,
    color: "#627EEA",
    explorerUrl: "https://sepolia.etherscan.io",
    logo: getChainLogoUrl(mainnet.id)!,
    capabilities: {
      balances: true,
      tokenDiscovery: true,
      activity: true,
      pricing: false,
    },
  },
};

export const DEFAULT_CHAIN_COLOR = "#627EEA";

export function getChainColor(chainId: number): string {
  return chainMeta[chainId]?.color ?? DEFAULT_CHAIN_COLOR;
}

export function getChainLogo(chainId: number): string | undefined {
  return chainMeta[chainId]?.logo;
}

export function getExplorerTxUrl(chainId: number, hash: string): string {
  const meta = chainMeta[chainId];
  if (!meta) return "";
  return `${meta.explorerUrl}/tx/${hash}`;
}

export function getChainCapabilities(chainId: number) {
  const meta = chainMeta[chainId];
  if (!meta) {
    return {
      balances: false,
      tokenDiscovery: false,
      activity: false,
      pricing: false,
    };
  }

  return meta.capabilities;
}

const LAST_CHAIN_KEY = "last-chain-id";

export function getLastChainId(): number | null {
  try {
    const stored = localStorage.getItem(LAST_CHAIN_KEY);
    return stored ? Number(stored) : null;
  } catch {
    return null;
  }
}

export function saveLastChainId(chainId: number) {
  try {
    localStorage.setItem(LAST_CHAIN_KEY, String(chainId));
  } catch {}
}

const allChains = Object.values(chainMeta).map((m) => m.chain);
const lastId = getLastChainId();
if (lastId && allChains.some((c) => c.id === lastId)) {
  const idx = allChains.findIndex((c) => c.id === lastId);
  allChains.unshift(allChains.splice(idx, 1)[0]);
}
export const supportedChains = allChains as [Chain, ...Chain[]];
