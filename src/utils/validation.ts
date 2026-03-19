import { isAddress, parseUnits } from "viem";

export function validateAddress(value: string): string | null {
  if (!value) return "Enter a recipient address";
  if (!isAddress(value)) return "Not a valid address. Check for typos";
  return null;
}

export function validateAmount(value: string, balance?: bigint, decimals = 18): string | null {
  if (!value) return "Enter an amount";
  let parsed: bigint;
  try {
    parsed = parseUnits(value, decimals);
  } catch {
    return "Not a valid number";
  }
  if (parsed <= 0n) return "Amount must be greater than zero";
  if (balance !== undefined && parsed > balance) return "Exceeds your balance";
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
