import type { Address } from "viem";
import type { TokenStandard, Transaction } from "./blockscout";
import { chainMeta, getChainCapabilities } from "./chains";
import { UnsupportedChainFeatureError } from "./errors";
import type { Erc20TokenInfo } from "./tokens";

// Avalanche Data API (formerly Glacier). Keyless access is rate limited per IP.
export const GLACIER_API_URL = "https://glacier-api.avax.network";

export const glacierChainIds = new Set<number>([43114]);

export function isGlacierChain(chainId: number): boolean {
  return glacierChainIds.has(chainId);
}

interface GlacierAddress {
  address: string;
  name?: string;
}

interface GlacierMethod {
  callType: string;
  methodHash: string;
  methodName?: string;
}

interface GlacierNativeTransaction {
  txHash: string;
  txStatus: string;
  blockTimestamp: number;
  from: GlacierAddress;
  to: GlacierAddress | null;
  method?: GlacierMethod;
  value: string;
  gasUsed: string;
  gasPrice: string;
}

interface GlacierTokenRef {
  ercType: TokenStandard;
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  tokenId?: string;
}

interface GlacierTokenTransfer {
  from: GlacierAddress;
  to: GlacierAddress | null;
  logIndex: number;
  value?: string;
  erc20Token?: GlacierTokenRef;
  erc721Token?: GlacierTokenRef;
  erc1155Token?: GlacierTokenRef;
}

interface GlacierTransactionItem {
  nativeTransaction: GlacierNativeTransaction;
  erc20Transfers?: GlacierTokenTransfer[];
  erc721Transfers?: GlacierTokenTransfer[];
  erc1155Transfers?: GlacierTokenTransfer[];
}

interface GlacierTransactionsResponse {
  transactions: GlacierTransactionItem[];
  nextPageToken?: string;
}

interface GlacierErc20Balance {
  ercType: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface GlacierErc20BalancesResponse {
  erc20TokenBalances: GlacierErc20Balance[];
  nextPageToken?: string;
}

// Glacier often returns only the selector; name the common ones like Blockscout does.
const KNOWN_SELECTORS: Record<string, string> = {
  "0xa9059cbb": "transfer",
  "0x23b872dd": "transferFrom",
  "0x095ea7b3": "approve",
  "0x42842e0e": "safeTransferFrom",
  "0xb88d4fde": "safeTransferFrom",
  "0xf242432a": "safeTransferFrom",
};

function methodLabel(method: GlacierMethod | undefined): string | null {
  if (!method || method.callType === "NATIVE_TRANSFER") return null;
  const name = method.methodName?.split("(")[0]?.trim();
  if (name) return name;
  const hash = method.methodHash?.toLowerCase();
  if (!hash) return null;
  return KNOWN_SELECTORS[hash] ?? hash;
}

function toIsoTimestamp(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

function calculateFee(tx: GlacierNativeTransaction): string {
  try {
    return (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString();
  } catch {
    return "0";
  }
}

function mapTransfer(
  tx: GlacierNativeTransaction,
  transfer: GlacierTokenTransfer,
  method: string | null,
): Transaction | null {
  const token = transfer.erc20Token ?? transfer.erc721Token ?? transfer.erc1155Token;
  if (!token) return null;

  const isNft = token.ercType === "ERC-721";
  return {
    hash: tx.txHash,
    from: transfer.from.address,
    to: transfer.to?.address ?? null,
    value: "0",
    status: "ok",
    timestamp: toIsoTimestamp(tx.blockTimestamp),
    method,
    fee: "0",
    toName: transfer.to?.name ?? null,
    toIsContract: false,
    transactionTypes: ["token_transfer"],
    protocol: null,
    tokenTransfer: {
      contract: token.address,
      symbol: token.symbol ?? null,
      name: token.name ?? null,
      decimals: isNft ? 0 : (token.decimals ?? (token.ercType === "ERC-1155" ? 0 : null)),
      amount: isNft ? "1" : (transfer.value ?? "0"),
      type: token.ercType,
    },
    logIndex: transfer.logIndex,
  };
}

export function mapGlacierTransactions(
  items: GlacierTransactionItem[],
  address: string,
): Transaction[] {
  const self = address.toLowerCase();
  const rows: Transaction[] = [];

  for (const item of items) {
    const tx = item.nativeTransaction;
    const method = methodLabel(tx.method);
    const isParty = tx.from.address.toLowerCase() === self || tx.to?.address.toLowerCase() === self;

    // Glacier also returns the parent tx of incoming token transfers; Blockscout lists only
    // txs the wallet sent or received directly, so skip the parent in that case.
    if (isParty) {
      rows.push({
        hash: tx.txHash,
        from: tx.from.address,
        to: tx.to?.address ?? null,
        value: tx.value,
        status: tx.txStatus === "1" ? "ok" : tx.txStatus === "0" ? "error" : null,
        timestamp: toIsoTimestamp(tx.blockTimestamp),
        method,
        fee: calculateFee(tx),
        toName: tx.to?.name ?? null,
        toIsContract: tx.method?.callType === "CONTRACT_CALL",
        transactionTypes: tx.method?.callType === "NATIVE_TRANSFER" ? ["coin_transfer"] : [],
        protocol: null,
      });
    }

    const transfers = [
      ...(item.erc20Transfers ?? []),
      ...(item.erc721Transfers ?? []),
      ...(item.erc1155Transfers ?? []),
    ];
    for (const transfer of transfers) {
      const row = mapTransfer(tx, transfer, method);
      if (row) rows.push(row);
    }
  }

  rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return rows;
}

export function fetchGlacierTransactions(
  chainId: number,
  address: Address,
): Promise<Transaction[]> {
  if (!getChainCapabilities(chainId).activity || !isGlacierChain(chainId)) {
    return Promise.reject(
      new UnsupportedChainFeatureError(
        "activity",
        chainId,
        `Activity unavailable on ${chainMeta[chainId]?.chain.name ?? `chain ${chainId}`}`,
      ),
    );
  }

  return (async () => {
    const response = await fetch(
      `${GLACIER_API_URL}/v1/chains/${chainId}/addresses/${address}/transactions?pageSize=50`,
    );
    if (!response.ok) throw new Error("Could not load activity");

    const data: GlacierTransactionsResponse = await response.json();
    return mapGlacierTransactions(data.transactions ?? [], address);
  })();
}

export async function discoverGlacierTokens(
  chainId: number,
  address: Address,
): Promise<Erc20TokenInfo[]> {
  if (!getChainCapabilities(chainId).tokenDiscovery || !isGlacierChain(chainId)) return [];

  const response = await fetch(
    `${GLACIER_API_URL}/v1/chains/${chainId}/addresses/${address}/balances:listErc20?pageSize=100&filterSpamTokens=true`,
  );
  if (!response.ok) return [];

  const data: GlacierErc20BalancesResponse = await response.json();
  return (data.erc20TokenBalances ?? [])
    .filter((token) => token.ercType === "ERC-20")
    .map((token) => ({
      address: token.address as Address,
      symbol: token.symbol,
      name: token.name,
      decimals: Number(token.decimals),
      source: "discovered",
      verification: "unverified",
    }));
}
