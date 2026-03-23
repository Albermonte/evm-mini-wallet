export class UnsupportedChainFeatureError extends Error {
  feature: string;
  chainId: number;

  constructor(feature: string, chainId: number, message: string) {
    super(message);
    this.name = "UnsupportedChainFeatureError";
    this.feature = feature;
    this.chainId = chainId;
  }
}
