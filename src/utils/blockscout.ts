import type { Address } from "viem";
import { chainMeta, getChainCapabilities } from "./chains";
import { UnsupportedChainFeatureError } from "./errors";

export const blockscoutApiUrls: Record<number, string> = {
  1: "https://eth.blockscout.com",
  137: "https://polygon.blockscout.com",
  42161: "https://arbitrum.blockscout.com",
  10: "https://optimism.blockscout.com",
  8453: "https://base.blockscout.com",
  11155111: "https://eth-sepolia.blockscout.com",
};

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

export function fetchBlockscoutTransactions(
  chainId: number,
  address: Address,
): Promise<Transaction[]> {
  if (!getChainCapabilities(chainId).activity) {
    return Promise.reject(
      new UnsupportedChainFeatureError(
        "activity",
        chainId,
        `Activity unavailable on ${chainMeta[chainId]?.chain.name ?? `chain ${chainId}`}`,
      ),
    );
  }

  const baseUrl = blockscoutApiUrls[chainId];
  if (!baseUrl) {
    return Promise.reject(new Error("Could not load activity"));
  }

  return (async () => {
    const response = await fetch(`${baseUrl}/api/v2/addresses/${address}/transactions`);
    if (!response.ok) {
      throw new Error("Could not load activity");
    }

    const data: BlockscoutTxResponse = await response.json();

    return data.items.map((item) => ({
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
  })();
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const meta = chainMeta[chainId];
  if (!meta) return "";
  return `${meta.explorerUrl}/address/${address}`;
}
