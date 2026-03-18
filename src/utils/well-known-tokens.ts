import type { Address } from "viem";
import type { TokenInfo } from "./tokens";

/**
 * Well-known ERC-20 tokens per chain, used as an RPC fallback
 * when the Blockscout API is unavailable.
 */
export const wellKnownTokens: Record<number, TokenInfo[]> = {
  // Ethereum Mainnet
  1: [
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address,
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    {
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" as Address,
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    {
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address,
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
    },
    {
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" as Address,
      symbol: "WBTC",
      name: "Wrapped BTC",
      decimals: 8,
    },
    {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" as Address,
      symbol: "UNI",
      name: "Uniswap",
      decimals: 18,
    },
    {
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA" as Address,
      symbol: "LINK",
      name: "Chainlink",
      decimals: 18,
    },
  ],

  // Polygon
  137: [
    {
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as Address,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    {
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as Address,
      symbol: "USDC.e",
      name: "Bridged USDC",
      decimals: 6,
    },
    {
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as Address,
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    {
      address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" as Address,
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    {
      address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619" as Address,
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
    },
    {
      address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" as Address,
      symbol: "WMATIC",
      name: "Wrapped MATIC",
      decimals: 18,
    },
    {
      address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6" as Address,
      symbol: "WBTC",
      name: "Wrapped BTC",
      decimals: 8,
    },
  ],

  // Arbitrum
  42161: [
    {
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    {
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" as Address,
      symbol: "USDC.e",
      name: "Bridged USDC",
      decimals: 6,
    },
    {
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as Address,
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    {
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as Address,
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    {
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" as Address,
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
    },
    {
      address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f" as Address,
      symbol: "WBTC",
      name: "Wrapped BTC",
      decimals: 8,
    },
    {
      address: "0x912CE59144191C1204E64559FE8253a0e49E6548" as Address,
      symbol: "ARB",
      name: "Arbitrum",
      decimals: 18,
    },
  ],

  // Optimism
  10: [
    {
      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    {
      address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" as Address,
      symbol: "USDC.e",
      name: "Bridged USDC",
      decimals: 6,
    },
    {
      address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" as Address,
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    {
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as Address,
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    {
      address: "0x4200000000000000000000000000000000000006" as Address,
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
    },
    {
      address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095" as Address,
      symbol: "WBTC",
      name: "Wrapped BTC",
      decimals: 8,
    },
    {
      address: "0x4200000000000000000000000000000000000042" as Address,
      symbol: "OP",
      name: "Optimism",
      decimals: 18,
    },
  ],

  // Base
  8453: [
    {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    {
      address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA" as Address,
      symbol: "USDbC",
      name: "Bridged USDC",
      decimals: 6,
    },
    {
      address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" as Address,
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    {
      address: "0x4200000000000000000000000000000000000006" as Address,
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
    },
  ],

  // BSC
  56: [
    {
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as Address,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 18,
    },
    {
      address: "0x55d398326f99059fF775485246999027B3197955" as Address,
      symbol: "USDT",
      name: "Tether USD",
      decimals: 18,
    },
    {
      address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" as Address,
      symbol: "BUSD",
      name: "Binance USD",
      decimals: 18,
    },
    {
      address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3" as Address,
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    {
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as Address,
      symbol: "WBNB",
      name: "Wrapped BNB",
      decimals: 18,
    },
    {
      address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" as Address,
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
    },
    {
      address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c" as Address,
      symbol: "BTCB",
      name: "Bitcoin BEP2",
      decimals: 18,
    },
  ],
};
