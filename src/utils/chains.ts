import type { Chain } from "@wagmi/vue/chains";
import { mainnet, polygon, arbitrum, optimism, base, bsc, sepolia } from "@wagmi/vue/chains";
import { getChainLogoUrl } from "./token-logos";

interface ChainMeta {
  chain: Chain;
  color: string;
  explorerUrl: string;
  logo: string;
}

export const chainMeta: Record<number, ChainMeta> = {
  [mainnet.id]: {
    chain: mainnet,
    color: "#627EEA",
    explorerUrl: "https://etherscan.io",
    logo: getChainLogoUrl(mainnet.id)!,
  },
  [polygon.id]: {
    chain: polygon,
    color: "#8247E5",
    explorerUrl: "https://polygonscan.com",
    logo: getChainLogoUrl(polygon.id)!,
  },
  [arbitrum.id]: {
    chain: arbitrum,
    color: "#28A0F0",
    explorerUrl: "https://arbiscan.io",
    logo: getChainLogoUrl(arbitrum.id)!,
  },
  [optimism.id]: {
    chain: optimism,
    color: "#FF0420",
    explorerUrl: "https://optimistic.etherscan.io",
    logo: getChainLogoUrl(optimism.id)!,
  },
  [base.id]: {
    chain: base,
    color: "#0052FF",
    explorerUrl: "https://basescan.org",
    logo: getChainLogoUrl(base.id)!,
  },
  [bsc.id]: {
    chain: bsc,
    color: "#F0B90B",
    explorerUrl: "https://bscscan.com",
    logo: getChainLogoUrl(bsc.id)!,
  },
  [sepolia.id]: {
    chain: sepolia,
    color: "#627EEA",
    explorerUrl: "https://sepolia.etherscan.io",
    logo: getChainLogoUrl(mainnet.id)!,
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

export const supportedChains = Object.values(chainMeta).map((m) => m.chain) as [Chain, ...Chain[]];
