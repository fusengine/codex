## Project Detection -> Domain Agent

Scan the active workspace first. When installed plugin metadata is needed, use
`${PLUGIN_ROOT}` from hooks or the installed cache path:
`~/.codex/plugins/cache/fusengine-codex/<plugin>/<version>/`.

| Project Indicator | Agent |
|-------------------|-------|
| `next.config.*`, `app/layout.tsx` | `nextjs-expert` when available |
| `composer.json` + `artisan` | `laravel-expert` when available |
| `package.json` + React | `react-expert` when available |
| `Package.swift`, `*.xcodeproj` | `swift-expert` when available |
| `tailwind.config.*`, `@import "tailwindcss"` | `tailwindcss-expert` when available |
| `components.json`, `@radix-ui/*`, `@base-ui/*` | `shadcn-ui-expert` when available |
| Custom Codex agent/skill metadata | Use the matching custom capability |
| **No match** | Use the default available coding agent |

Priority: Custom > Framework (Next.js > React) > UI library > default.
Prefer a domain expert when it exists, but do not assume a fixed agent name is
registered in every Codex runtime.
