import { createConfig, fallback, http } from "@wagmi/vue";
import { supportedChains } from "../utils/chains";
import { getChainRpcUrls } from "../utils/chains";

function createTransport(chainId: number) {
  const urls = getChainRpcUrls(chainId);
  if (urls.length === 0) return http();
  if (urls.length === 1) return http(urls[0]);
  return fallback(urls.map((url) => http(url)));
}

export const config = createConfig({
  chains: supportedChains,
  transports: Object.fromEntries(
    supportedChains.map((chain) => [chain.id, createTransport(chain.id)]),
  ),
});
