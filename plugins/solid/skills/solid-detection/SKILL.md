---
name: solid-detection
description: "Detect project language and route to the matching SOLID skill using configuration files, interface conventions, and file-size rules. Use when the stack or interface location is unknown. Do NOT use for implementation after the stack-specific skill is selected."
---

# SOLID Detection

Load [language-rules.md](references/language-rules.md) only when exact interface directories, pattern regexes, or line-counting rules are needed.

## Project Detection

| Priority | Indicator | Route |
|----------|-----------|-------|
| 1 | Next.js in package.json | nextjs-expert:solid-nextjs |
| 2 | React without Next.js | react-expert:solid-react |
| 3 | TypeScript/Bun/Node without framework | solid:solid-generic |
| 4 | composer.json with Laravel | laravel-expert:solid-php |
| 5 | Package.swift or Xcode project | swift-apple-expert:solid-swift |
| 6 | pom.xml or Gradle | solid:solid-java |
| 7 | go.mod | solid:solid-go |
| 8 | Gemfile and Rakefile | solid:solid-ruby |
| 9 | Cargo.toml | solid:solid-rust |
| 10 | pyproject.toml or requirements.txt | solid:solid-python |

Use the first matching route. Inspect the actual project files before selecting a skill.

## Validation Actions

| Finding | Action |
|---------|--------|
| Interface in the wrong location | Block |
| File over the stack limit | Warn and split near the local threshold |
| Missing required public documentation | Warn and correct |

## Tracking Environment

When project detection scripts expose state, use:

```bash
SOLID_PROJECT_TYPE=nextjs|react|generic|laravel|swift|java|go|ruby|rust|python|unknown
SOLID_FILE_LIMIT=100|150
SOLID_INTERFACE_DIR=path/to/interfaces
SOLID_STRUCTURE=modular
```
