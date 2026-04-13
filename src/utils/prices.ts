import { formatUnits, getAddress } from "viem";
import type { TokenInfo } from "./tokens";
import { getTokenKey } from "./tokens";

const coinGeckoPlatformIds: Record<number, string> = {
  1: "ethereum",
  10: "optimistic-ethereum",
  56: "binance-smart-chain",
  137: "polygon-pos",
  8453: "base",
  42161: "arbitrum-one",
};

const coinGeckoNativeCoinIds: Record<number, string> = {
  1: "ethereum",
  10: "ethereum",
  56: "binancecoin",
  137: "polygon-ecosystem-token",
  8453: "ethereum",
  42161: "ethereum",
};

type PriceMap = Record<string, number | null>;

export function getCoinGeckoPlatformId(chainId: number): string | null {
  return coinGeckoPlatformIds[chainId] ?? null;
}

export function getCoinGeckoNativeCoinId(chainId: number): string | null {
  return coinGeckoNativeCoinIds[chainId] ?? null;
}

function createEmptyPriceMap(tokens: TokenInfo[]): PriceMap {
  return Object.fromEntries(tokens.map((token) => [getTokenKey(token), null]));
}

export async function fetchTokenPrices(
  chainId: number,
  tokens: TokenInfo[],
  vsCurrency = "usd",
): Promise<PriceMap> {
  const priceMap = createEmptyPriceMap(tokens);
  if (tokens.length === 0) return priceMap;

  const currency = vsCurrency.toLowerCase();
  const nativeCoinId = getCoinGeckoNativeCoinId(chainId);
  const nativeTokens = tokens.filter((token) => token.isNative);
  const erc20Tokens = tokens.filter((token) => !token.isNative);
  const requests: Promise<void>[] = [];

  if (nativeTokens.length > 0 && nativeCoinId) {
    requests.push(
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${nativeCoinId}&vs_currencies=${currency}`,
      )
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as Record<string, Record<string, number>>;
          const nativePrice = data[nativeCoinId]?.[currency] ?? null;
          for (const token of nativeTokens) {
            priceMap[getTokenKey(token)] = nativePrice;
          }
        })
        .catch(() => undefined),
    );
  }

  const platformId = getCoinGeckoPlatformId(chainId);
  if (erc20Tokens.length > 0 && platformId) {
    for (const token of erc20Tokens) {
      const address = getAddress(token.address).toLowerCase();

      requests.push(
        fetch(
          `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${address}&vs_currencies=${currency}`,
        )
          .then(async (response) => {
            if (!response.ok) return;
            const data = (await response.json()) as Record<string, Record<string, number>>;
            priceMap[getTokenKey(token)] = data[address]?.[currency] ?? null;
          })
          .catch(() => undefined),
      );
    }
  }

  await Promise.all(requests);

  return priceMap;
}

export function calculateFiatValue(
  balance: bigint,
  decimals: number,
  price: number | null,
): number | null {
  if (price === null) return null;
  return Number(formatUnits(balance, decimals)) * price;
}
