## Project Detection -> Domain Agent

Scan: plugin agents (paths injected at SessionStart — never hardcode marketplace paths) + `~/.codex/agents/*.md`

| Project Indicator | Agent |
|-------------------|-------|
| `next.config.*`, `app/layout.tsx` | `nextjs-expert` |
| `astro.config.*`, `src/pages/*.astro` | `astro-expert` |
| `composer.json` + `artisan` | `laravel-expert` |
| `composer.json` WITHOUT artisan file | `php-expert` |
| `@tanstack/react-start` in package.json, `tanstackStart()` in vite.config.* | `tanstack-start-expert` |
| `package.json` + React | `react-expert` |
| `tsconfig.json` with NO framework config (no next/astro/vite-react/tanstackStart) | `typescript-expert` |
| `Package.swift`, `*.xcodeproj` | `swift-expert` |
| `Cargo.toml` | `rust-expert` |
| `go.mod` | `go-expert` |
| `tailwind.config.*` | `tailwindcss-expert` |
| `components.json`, `@radix-ui/*` | `shadcn-ui-expert` |
| Custom `~/.codex/agents/*.md` | Use matching custom agent |
| **No match** | `general-purpose` |

Priority: Custom > Framework (Next.js > Astro > Laravel > TanStack Start > React) > Language (TypeScript, PHP, Swift, Rust, Go) > UI library > `general-purpose`
**FORBIDDEN:** `general-purpose` when domain agent exists.
