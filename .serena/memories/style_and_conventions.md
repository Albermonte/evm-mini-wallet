# Code Style and Conventions

## Vue Components

- **Composition API** with `<script setup lang="ts">` — always
- **No Options API** unless project explicitly requires it
- Props defined with `defineProps<{...}>()` and `withDefaults()`
- Template uses Tailwind utility classes directly (no scoped CSS)
- Components follow PascalCase naming (e.g., `BaseButton.vue`, `TokenList.vue`)
- Composables follow `use*` naming convention (e.g., `usePortfolio.ts`)

## TypeScript

- Strict mode enabled (`strict: true`)
- `noUnusedLocals` and `noUnusedParameters` enforced
- `verbatimModuleSyntax` — use explicit `import type` for type-only imports
- Target: ES2023, Module: ESNext, bundler resolution
- Imports from `vite-plus` for Vite utilities, `vite-plus/test` for Vitest utilities

## Styling

- Tailwind CSS v4 with custom theme tokens in `src/style.css`
- Design tokens: `primary-*` (grayscale for text/elements), `surface-*` (grayscale for backgrounds)
- Font: `--font-display` and `--font-sans` both use Space Grotesk
- Dark mode: class-based (`.dark` class on root), use `dark:` Tailwind variant
- No brand/accent colors — strictly monochrome

## Icons

- Use `lucide-vue-next` for all icons — do NOT use other icon libraries

## Testing

- Test files are co-located with source: `Component.test.ts` next to `Component.vue`
- Import test utilities from `vite-plus/test` (NOT from `vitest` directly)
- Use `@vue/test-utils` for component mounting
- jsdom as test environment

## Formatting & Linting

- Oxfmt for formatting (via `vp fmt`)
- Oxlint for linting (via `vp lint`)
- Auto-fix on staged files via pre-commit hook (`vp check --fix`)
