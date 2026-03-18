export function calculateMaxSendable(
  balance: bigint,
  gasLimit: bigint,
  feePerGas: bigint,
): bigint | null {
  const gasCost = gasLimit * feePerGas;
  const spendable = balance - gasCost;
  return spendable > 0n ? spendable : null;
}

export function resolveTransactionChainId(
  submittedChainId?: number | null,
  activeChainId?: number | null,
): number | null {
  return submittedChainId ?? activeChainId ?? null;
}
