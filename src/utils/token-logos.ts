import { getAddress, type Address } from "viem";

const trustWalletChains: Record<number, string> = {
  1: "ethereum",
  137: "polygon",
  42161: "arbitrum",
  10: "optimism",
  8453: "base",
  56: "smartchain",
};

export function getChainLogoUrl(chainId: number): string | undefined {
  const twChain = trustWalletChains[chainId];
  if (!twChain) return undefined;
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${twChain}/info/logo.png`;
}

export function getNativeTokenLogoUrls(chainId: number): string[] {
  const url = getChainLogoUrl(chainId);
  return url ? [url] : [];
}

export function getTokenLogoUrls(chainId: number, address: Address): string[] {
  const checksumAddress = getAddress(address);
  const urls: string[] = [];

  // 1. Trust Wallet Assets — best coverage, community-maintained
  const twChain = trustWalletChains[chainId];
  if (twChain) {
    urls.push(
      `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${twChain}/assets/${checksumAddress}/logo.png`,
    );
  }

  // 2. SmolDapp — good multi-chain support, uses numeric chain IDs
  urls.push(`https://assets.smold.app/api/token/${chainId}/${checksumAddress}/logo-128.png`);

  return urls;
}
