## Project Detection -> Domain Agent

Scan active workspace first. When plugin metadata is needed, use paths injected at SessionStart/SubagentStart, `${PLUGIN_ROOT}`, or the installed cache path. Do not hardcode marketplace versions.

| Project Indicator | Agent |
|-------------------|-------|
| `next.config.*`, `app/layout.tsx` | `nextjs-expert` when available |
| `astro.config.*`, `src/pages/*.astro` | `astro-expert` when available |
| `composer.json` + `artisan` | `laravel-expert` when available |
| `composer.json` without `artisan` | `php-expert` when available |
| `@tanstack/react-start` in `package.json`, `tanstackStart()` in Vite config | `tanstack-start-expert` when available |
| `package.json` + React | `react-expert` when available |
| `tsconfig.json` with no framework config | `typescript-expert` when available |
| `Package.swift`, `*.xcodeproj` | `swift-expert` when available |
| `Cargo.toml` | `rust-expert` when available |
| `go.mod` | `go-expert` when available |
| `tailwind.config.*`, `@import "tailwindcss"` | `tailwindcss-expert` when available |
| `components.json`, `@radix-ui/*`, `@base-ui/*` | `shadcn-ui-expert` when available |
| Custom Codex agent/skill metadata | matching custom capability |
| **No match** | default available coding agent |

Priority: Custom > Framework (Next.js > Astro > TanStack Start > React) > Language (TypeScript, PHP, Rust, Go, Swift) > UI library > default.
**FORBIDDEN:** default agent when a matching domain agent exists and is available.
