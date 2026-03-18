import { http, createConfig } from "@wagmi/vue";
import { supportedChains } from "../utils/chains";

export const config = createConfig({
  chains: supportedChains,
  transports: Object.fromEntries(supportedChains.map((chain) => [chain.id, http()])),
});
