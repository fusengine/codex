## Project Detection -> Domain Agent

Scan: `~/.codex/plugins/marketplaces/fusengine-plugins/plugins/*/` + `~/.codex/agents/*.md`

| Project Indicator | Agent |
|-------------------|-------|
| `next.config.*`, `app/layout.tsx` | `fuse-nextjs:nextjs-expert` |
| `composer.json` + `artisan` | `fuse-laravel:laravel-expert` |
| `package.json` + React | `fuse-react:react-expert` |
| `Package.swift`, `*.xcodeproj` | `fuse-swift-apple-expert:swift-expert` |
| `tailwind.config.*` | `fuse-tailwindcss:tailwindcss-expert` |
| `components.json`, `@radix-ui/*` | `fuse-shadcn-ui:shadcn-ui-expert` |
| Custom `~/.codex/agents/*.md` | Use matching custom agent |
| **No match** | `general-purpose` |

Priority: Custom > Framework (Next.js > React) > UI library > `general-purpose`
**FORBIDDEN:** `general-purpose` when domain agent exists.
