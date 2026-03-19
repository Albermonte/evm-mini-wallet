import type { Address } from "viem";
import { chainMeta } from "./chains";

const CACHE_TTL = 30_000;

const blockscoutApiUrls: Record<number, string> = {
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

const cache = new Map<string, { data: Transaction[]; timestamp: number }>();
const pending = new Map<string, Promise<Transaction[]>>();

export function clearTransactionCache() {
  cache.clear();
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
  const baseUrl = blockscoutApiUrls[chainId];
  if (!baseUrl) return Promise.resolve([]);

  const key = `${chainId}:${address.toLowerCase()}`;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return Promise.resolve(cached.data);

  const inflight = pending.get(key);
  if (inflight) return inflight;

  const request = (async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v2/addresses/${address}/transactions`);
      if (!response.ok) return [];

      const data: BlockscoutTxResponse = await response.json();

      const transactions = data.items.map((item) => ({
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

      cache.set(key, { data: transactions, timestamp: Date.now() });
      return transactions;
    } catch {
      return [];
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, request);
  return request;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const meta = chainMeta[chainId];
  if (!meta) return "";
  return `${meta.explorerUrl}/address/${address}`;
}
