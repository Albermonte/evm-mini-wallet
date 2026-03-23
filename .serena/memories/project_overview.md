# EVM Mini Wallet - Project Overview

## Purpose

A mobile-first EVM cryptocurrency wallet web application for quick send/receive operations. Built for everyday crypto users who want a fast, minimal-friction tool for common wallet tasks.

## Tech Stack

- **Framework**: Vue 3 (Composition API with `<script setup lang="ts">`)
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite+ (`vp` CLI) — unified toolchain wrapping Vite, Vitest, Oxlint, Oxfmt
- **Styling**: Tailwind CSS v4 (with custom design tokens in style.css)
- **State/Data**: @wagmi/vue for wallet connection, @tanstack/vue-query for async state
- **UI Libraries**: Reka UI (headless components), Lucide Vue Next (icons), Motion V (animations)
- **Blockchain**: viem for EVM interactions
- **Package Manager**: pnpm 10.x (managed through `vp`)
- **Testing**: Vitest + @vue/test-utils + jsdom

## Design Direction

- **Monochrome only** — black, white, grays. No brand or accent colors.
- **Typography**: Space Grotesk — bold weights, tight tracking
- **Theme**: Light + dark mode (class-based toggle with `.dark`)
- **Brand personality**: Sleek, premium, quiet luxury minimalism
- **Mobile-first**: All UI is touch-optimized, generous tap targets

## Key Dependencies

- `@wagmi/vue` — wallet connection and EVM interactions
- `@tanstack/vue-query` — server state management
- `viem` — low-level EVM utilities (addresses, transactions, encoding)
- `reka-ui` — accessible headless UI components
- `lucide-vue-next` — icon library (preferred for all icons)
- `motion-v` — Vue animation library
- `qrcode` / `qr-scanner` — QR code generation and scanning
