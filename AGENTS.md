# Project Guidelines

## Mobile First

This is a mobile-first wallet app. All development effort should be directed towards mobile design. Prioritize touch-friendly interactions, mobile viewport layouts, and small-screen usability in every feature and UI change.

## Design Direction

Black and white, punchy feeling. Do not introduce brand colors or accent colors. Keep the palette strictly monochrome (black, white, grays). Achieve visual impact through extreme contrast, bold typography weights, sharp borders, and dramatic scale hierarchy — not through color.

## Design Context

### Users

Everyday crypto users who know blockchain basics. They want a fast, no-fuss tool for common tasks — not a learning environment and not a power-user dashboard. They're using this on mobile, often on the go, and expect things to just work.

### Core Job

Quick send/receive. Get in, send tokens, get out. Speed and clarity are paramount — every extra tap or moment of confusion is a failure.

### Brand Personality

**Sleek, premium, quiet.** Luxury minimalism with understated confidence. Think high-end product design — the kind where restraint IS the statement. Not loud, not flashy, but unmistakably refined.

### Aesthetic Direction

- **Palette**: Strictly monochrome — black, white, grays. No brand colors, no accents.
- **Typography**: Space Grotesk — geometric, modern, confident. Bold weights for hierarchy, tight tracking for density.
- **Theme**: Light + dark mode. Both should feel equally premium.
- **Anti-references**: Colorful crypto dashboards, gamified DeFi interfaces, glassmorphic "web3" aesthetics.

### Design Principles

1. **Clarity over cleverness** — Every element earns its place. If it doesn't help the user send or receive, question it.
2. **Confidence through restraint** — Premium feel comes from what you leave out, not what you add. Whitespace is a feature.
3. **Speed is respect** — Respect the user's time. Minimal steps, immediate feedback, no unnecessary screens.
4. **Contrast is the only color** — Hierarchy must come from bold type scale differences, weight contrasts, and spatial rhythm.
5. **Touch-first, always** — Every target is generous, every gesture is natural, every interaction feels physical.

### Accessibility

WCAG AA compliance. Good contrast ratios, full keyboard navigation, screen reader support, reduced motion respect.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vp test` command, run it using `vp run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
