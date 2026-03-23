import { isAddress } from "viem";

export interface Eip681Result {
  address: string;
  chainId?: number;
  value?: string;
  token?: string;
  amount?: string;
}

/**
 * Parses an EIP-681 payment URI or plain Ethereum address.
 *
 * Supported formats:
 * - `0x1234...` — plain address
 * - `ethereum:0x1234...` — simple EIP-681
 * - `ethereum:0x1234...@1?value=1000` — native transfer with chain and value
 * - `ethereum:0xToken/transfer?address=0xRecipient&uint256=1000` — ERC-20 transfer
 */
export function parseEip681(input: string): Eip681Result | null {
  const trimmed = input.trim();

  // Plain address (no prefix)
  if (!trimmed.startsWith("ethereum:") && isAddress(trimmed)) {
    return { address: trimmed };
  }

  if (!trimmed.startsWith("ethereum:")) return null;

  const withoutPrefix = trimmed.slice("ethereum:".length);

  // Split path and query string
  const [pathPart, queryString] = withoutPrefix.split("?", 2);

  // Parse params from query string
  const params = new URLSearchParams(queryString ?? "");

  // Path can be: address, address@chainId, or address/functionName
  let addressPart = pathPart;
  let chainId: number | undefined;
  let functionName: string | undefined;

  // Check for /functionName
  const slashIdx = addressPart.indexOf("/");
  if (slashIdx !== -1) {
    functionName = addressPart.slice(slashIdx + 1);
    addressPart = addressPart.slice(0, slashIdx);
  }

  // Check for @chainId
  const atIdx = addressPart.indexOf("@");
  if (atIdx !== -1) {
    const chainStr = addressPart.slice(atIdx + 1);
    if (!/^\d+$/.test(chainStr)) return null;
    chainId = Number.parseInt(chainStr, 10);
    if (Number.isNaN(chainId)) return null;
    addressPart = addressPart.slice(0, atIdx);
  }

  // ERC-20 transfer: ethereum:0xTokenContract/transfer?address=0xRecipient&uint256=amount
  if (functionName === "transfer") {
    const recipientAddress = params.get("address");
    const tokenAmount = params.get("uint256");

    if (!recipientAddress || !isAddress(recipientAddress)) return null;
    if (!isAddress(addressPart)) return null;

    return {
      address: recipientAddress,
      chainId,
      token: addressPart,
      amount: tokenAmount ?? undefined,
    };
  }

  // Native transfer: ethereum:0xAddress[@chainId][?value=xxx]
  if (!isAddress(addressPart)) return null;

  const result: Eip681Result = { address: addressPart };
  if (chainId !== undefined) result.chainId = chainId;

  const value = params.get("value");
  if (value) result.value = value;

  return result;
}
