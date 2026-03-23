import type { Address } from "viem";

export type TokenSource = "native" | "curated" | "discovered";
export type TokenVerification = "verified" | "unverified";

interface BaseTokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  source?: TokenSource;
  verification?: TokenVerification;
}

export interface NativeTokenInfo extends BaseTokenInfo {
  address: null;
  isNative: true;
}

export interface Erc20TokenInfo extends BaseTokenInfo {
  address: Address;
  isNative?: false;
}

export type TokenInfo = NativeTokenInfo | Erc20TokenInfo;

export function getTokenKey(token: TokenInfo): string {
  return token.isNative ? `native:${token.symbol}` : token.address;
}

export const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;
