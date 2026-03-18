import { isAddress, parseUnits } from "viem";

export function validateAddress(value: string): string | null {
  if (!value) return "Address is required";
  if (!isAddress(value)) return "Invalid Ethereum address";
  return null;
}

export function validateAmount(value: string, balance?: bigint, decimals = 18): string | null {
  if (!value) return "Amount is required";
  let parsed: bigint;
  try {
    parsed = parseUnits(value, decimals);
  } catch {
    return "Enter a valid positive amount";
  }
  if (parsed <= 0n) return "Enter a valid positive amount";
  if (balance !== undefined && parsed > balance) return "Insufficient balance";
  return null;
}

export type ErrorLike = {
  message?: string;
  shortMessage?: string;
  name?: string;
  code?: number | string;
  cause?: unknown;
};

function hasRejectionCode(code: ErrorLike["code"]): boolean {
  return code === 4001 || code === "4001" || code === "ACTION_REJECTED";
}

function toErrorLike(value: unknown): ErrorLike | null {
  if (!value || typeof value !== "object") return null;
  return value as ErrorLike;
}

export function isUserRejection(err: ErrorLike): boolean {
  const cause = toErrorLike(err.cause);

  if (hasRejectionCode(err.code) || hasRejectionCode(cause?.code)) {
    return true;
  }

  const name = err.name?.toLowerCase() ?? "";
  if (name.includes("rejected")) {
    return true;
  }

  const message = `${err.shortMessage ?? ""} ${err.message ?? ""}`.toLowerCase();
  return (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("rejected request") ||
    message.includes("denied transaction")
  );
}
