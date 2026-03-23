# Suggested Commands

**IMPORTANT**: This project uses Vite+ (`vp` CLI). Do NOT use pnpm/npm/yarn directly.

## Development

- `vp dev` — Start development server
- `vp build` — Build for production (runs vue-tsc type check first)
- `vp preview` — Preview production build

## Quality Checks

- `vp check` — Run format, lint, and TypeScript type checks (all-in-one)
- `vp check --fix` — Auto-fix format and lint issues
- `vp lint` — Lint code with Oxlint
- `vp lint --type-aware` — Lint with TypeScript type-aware rules
- `vp fmt` — Format code with Oxfmt

## Testing

- `vp test` — Run all tests with Vitest
- `vp test src/utils/format.test.ts` — Run a specific test file
- `vp test --watch` — Run tests in watch mode

## Dependencies

- `vp install` — Install dependencies (run after pulling changes)
- `vp add <package>` — Add a dependency
- `vp remove <package>` — Remove a dependency

## System Utilities (macOS/Darwin)

- `git` — Version control
- `ls`, `cd`, `find`, `grep` — Standard file system navigation
- Note: macOS uses BSD variants of commands (e.g., `sed` differs from GNU)

## Pre-commit

- Staged files are automatically checked with `vp check --fix` (configured in vite.config.ts)
