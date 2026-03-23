# Codebase Structure

```
src/
├── main.ts                    # App entry point (Vue + Wagmi + VueQuery setup)
├── App.vue                    # Root component
├── style.css                  # Global styles, Tailwind config, design tokens
├── env.d.ts                   # Vite client type declarations
├── config/
│   └── wagmi.ts               # Wagmi configuration (chains, connectors)
├── composables/               # Vue composables (use* pattern)
│   ├── usePortfolio.ts        # Portfolio value aggregation
│   ├── useWalletTokens.ts     # Token balance management
│   ├── useWalletActivity.ts   # Transaction history
│   ├── useReceive.ts          # Receive flow logic
│   ├── useEip6963.ts          # EIP-6963 wallet discovery
│   ├── useQrScanner.ts        # QR code scanning
│   ├── useTheme.ts            # Dark/light theme toggle
│   ├── useToast.ts            # Toast notifications
│   ├── useClipboard.ts        # Clipboard operations
│   ├── useAnimatedNumber.ts   # Animated number transitions
│   ├── usePullToRefresh.ts    # Pull-to-refresh gesture
│   └── useTransactionNotifier.ts
├── utils/                     # Pure utility functions
│   ├── chains.ts              # Chain definitions and helpers
│   ├── tokens.ts              # Token type definitions
│   ├── token-balances.ts      # Token balance fetching
│   ├── token-logos.ts         # Token logo resolution
│   ├── transactions.ts        # Transaction helpers
│   ├── blockscout.ts          # Blockscout API integration
│   ├── prices.ts / price-cache.ts  # Price fetching and caching
│   ├── format.ts              # Number/address formatting
│   ├── eip681.ts              # EIP-681 payment URI parsing
│   ├── validation.ts          # Input validation
│   ├── errors.ts              # Error handling utilities
│   └── well-known-tokens.ts   # Well-known token addresses
├── components/
│   ├── ui/                    # Reusable UI primitives
│   │   ├── BaseButton.vue, BaseCard.vue, BaseModal.vue
│   │   ├── BaseInput.vue, BaseTextarea.vue, BaseField.test.ts
│   │   ├── TokenLogo.vue, TokenRow.vue
│   │   ├── StatusBadge.vue, Toast.vue, EmptyState.vue
│   │   ├── ThemeToggle.vue, SettingsButton.vue
│   │   └── *.test.ts files
│   ├── layout/
│   │   └── AppHeader.vue      # Top navigation bar
│   ├── actions/
│   │   ├── SendTransaction.vue # Send token flow
│   │   ├── TransactionList.vue # Transaction history display
│   │   ├── QrScanner.vue      # QR code scanner
│   │   └── *.test.ts files
│   └── wallet/
│       ├── ConnectWallet.vue   # Wallet connection UI
│       ├── AccountInfo.vue     # Account address display
│       ├── BalanceDisplay.vue  # Total balance
│       ├── TokenList.vue       # Token portfolio list
│       ├── ChainSelector.vue   # Network selector
│       ├── ReceiveSheet.vue    # Receive sheet with QR
│       └── *.test.ts files
├── assets/                    # Static assets
└── public/                    # Public static files
```
