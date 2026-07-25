## Project Detection -> Domain Agent
Scan workspace first (plugin paths/`${PLUGIN_ROOT}`/cache — never hardcode versions). Priority: Custom > Framework (Next.js > Astro > Laravel > TanStack Start > React) > Language (TS/PHP/Rust/Go/Swift) > UI library > default; never default when a match exists.
`next.config.*`/`app/layout.tsx` -> `nextjs-expert`
`astro.config.*`/`src/pages/*.astro` -> `astro-expert`
`composer.json`+`artisan` -> `laravel-expert`
`composer.json` no `artisan` -> `php-expert`
`@tanstack/react-start`/`tanstackStart()` -> `tanstack-start-expert`
`package.json`+React -> `react-expert`
`tsconfig.json` no framework -> `typescript-expert`
`Package.swift`/`*.xcodeproj` -> `swift-expert`
`Cargo.toml` -> `rust-expert`
`go.mod` -> `go-expert`
`tailwind.config.*`/`@import "tailwindcss"` -> `tailwindcss-expert`
`components.json`/`@radix-ui`/`@base-ui` -> `shadcn-ui-expert`
Custom Codex agent/skill metadata -> matching custom capability
No match -> default available coding agent
