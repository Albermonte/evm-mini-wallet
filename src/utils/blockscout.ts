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

export type TokenStandard = "ERC-20" | "ERC-721" | "ERC-1155";

export interface TokenTransferInfo {
  contract: string;
  symbol: string | null;
  name: string | null;
  decimals: number | null;
  amount: string;
  type: TokenStandard;
}

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
  tokenTransfer?: TokenTransferInfo;
  logIndex?: number;
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

interface BlockscoutTokenInfo {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: string | null;
  type: TokenStandard;
}

interface BlockscoutTokenTransferItem {
  tx_hash: string;
  from: BlockscoutAddressInfo;
  to: BlockscoutAddressInfo | null;
  total: { value: string; decimals: string | null };
  token: BlockscoutTokenInfo;
  timestamp: string;
  log_index: number;
  method: string | null;
}

interface BlockscoutTokenTransferResponse {
  items: BlockscoutTokenTransferItem[];
  next_page_params: Record<string, string> | null;
}

function extractProtocol(info: BlockscoutAddressInfo | null): string | null {
  if (!info?.metadata?.tags) return null;
  const protocolTag = info.metadata.tags.find((t) => t.tagType === "protocol");
  return protocolTag?.name ?? null;
}

function parseDecimals(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function mapNativeTx(item: BlockscoutTxItem): Transaction {
  return {
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
  };
}

function mapTokenTransfer(item: BlockscoutTokenTransferItem): Transaction {
  return {
    hash: item.tx_hash,
    from: item.from.hash,
    to: item.to?.hash ?? null,
    value: "0",
    status: "ok",
    timestamp: item.timestamp,
    method: item.method,
    fee: "0",
    toName: item.to?.name ?? null,
    toIsContract: item.to?.is_contract ?? false,
    transactionTypes: ["token_transfer"],
    protocol: extractProtocol(item.to),
    tokenTransfer: {
      contract: item.token.address,
      symbol: item.token.symbol,
      name: item.token.name,
      decimals: parseDecimals(item.token.decimals),
      amount: item.total.value,
      type: item.token.type,
    },
    logIndex: item.log_index,
  };
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
    const [txResponse, transferResponse] = await Promise.all([
      fetch(`${baseUrl}/api/v2/addresses/${address}/transactions`),
      fetch(`${baseUrl}/api/v2/addresses/${address}/token-transfers`),
    ]);

    if (!txResponse.ok || !transferResponse.ok) {
      throw new Error("Could not load activity");
    }

    const [txData, transferData]: [BlockscoutTxResponse, BlockscoutTokenTransferResponse] =
      await Promise.all([txResponse.json(), transferResponse.json()]);

    const merged: Transaction[] = [
      ...txData.items.map(mapNativeTx),
      ...transferData.items.map(mapTokenTransfer),
    ];

    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  })();
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const meta = chainMeta[chainId];
  if (!meta) return "";
  return `${meta.explorerUrl}/address/${address}`;
}
