# EVM Mini Wallet

A lightweight, mobile-first wallet for sending and receiving tokens across EVM chains. Built for speed — get in, send tokens, get out.

## Features

- **Multi-chain** — Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, and Sepolia
- **Token discovery** — Automatically detects ERC-20 tokens via Blockscout
- **Live prices** — Real-time portfolio value from CoinGecko
- **QR scanner** — Scan addresses and EIP-681 payment URIs
- **Transaction history** — Activity feed powered by Blockscout
- **Dark mode** — Light and dark themes with persistent preference
- **Pull-to-refresh** — Native mobile gesture to reload data
- **Accessible** — WCAG AA compliant, keyboard navigable, screen reader friendly

## Tech Stack

Vue 3 · TypeScript · Tailwind CSS v4 · wagmi · viem · TanStack Query · Reka UI · Motion V · Vite+

## Getting Started

```bash
# Install dependencies
vp install

# Start dev server
vp dev

# Run checks and tests
vp check
vp test

# Build for production
vp build
```

> This project uses [Vite+](https://github.com/nicepkg/vite-plus) as its unified toolchain. Use `vp` instead of npm/pnpm directly.

## Supported Networks

| Network         | Chain ID |
| --------------- | -------- |
| Ethereum        | 1        |
| Polygon         | 137      |
| Arbitrum One    | 42161    |
| Optimism        | 10       |
| Base            | 8453     |
| BNB Smart Chain | 56       |
| Sepolia         | 11155111 |

## Project Structure

```
src/
├── components/
│   ├── layout/       # App header, navigation
│   ├── wallet/       # Connect, balance, tokens, account
│   ├── actions/      # Send, transactions, QR scanner
│   └── ui/           # Buttons, inputs, modals, toasts
├── composables/      # Reusable Vue composition functions
├── config/           # Wagmi chain & transport config
└── utils/            # Chains, tokens, prices, validation, formatting
```

## Design

Monochrome. Bold typography (Space Grotesk). High contrast. No accent colors. Premium minimalism — restraint is the statement.

## License

MIT
