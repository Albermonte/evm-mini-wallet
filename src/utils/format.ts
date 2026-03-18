import { formatUnits } from "viem";

export function formatBalance(value: bigint, decimals = 18, maxDecimals = 4): string {
  const formatted = formatUnits(value, decimals);
  const [integer, decimal] = formatted.split(".");
  if (!decimal) return integer ?? "0";
  return `${integer}.${decimal.slice(0, maxDecimals)}`;
}

export function truncateAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
