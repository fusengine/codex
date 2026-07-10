# Fusengine Codex Plugins

![version](https://img.shields.io/badge/version-1.0.29-blue?style=flat-square)
![plugins](https://img.shields.io/badge/plugins-25-brightgreen?style=flat-square)
![runtime](https://img.shields.io/badge/runtime-Bun-black?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

> **Codex CLI plugin marketplace.** 19 expert plugins for APEX workflow,
> SOLID/DRY enforcement, framework specialists, and MCP integrations. The
> implementation follows the official Codex CLI documentation at
> `developers.openai.com/codex`.

## Installation

```bash
codex plugin marketplace add https://github.com/fusengine/codex.git
~/.codex/.tmp/marketplaces/fusengine-codex/setup.sh
```

Windows PowerShell:

```powershell
codex plugin marketplace add https://github.com/fusengine/codex.git
~/.codex/.tmp/marketplaces/fusengine-codex/setup.ps1
```

That is all. The script runs from the temporary Codex marketplace checkout,
installs dependencies, registers the marketplace, enables hooks, copies
`AGENTS.md`, enables the 19 plugins, prompts for Codex configuration (model,
reasoning effort, personality, approval policy, sandbox mode) and MCP API keys,
installs a shell autoloader (`~/.config/fish/conf.d/codex-env.fish`,
`~/.zshrc`, `~/.bashrc`, or the PowerShell profile), and resolves plugin
`${VAR}` placeholders into static values in `~/.codex/config.toml`.

**Prerequisites:** [Bun](https://bun.sh) and
[Codex CLI](https://developers.openai.com/codex/cli) 0.130+.

### Codex Config

The setup prompts for top-level `~/.codex/config.toml` keys. `(skip)` preserves
the existing value.

| Key | Values | Docs |
|---|---|---|
| `model` | gpt-5.5, gpt-5.4 | [config-sample](https://developers.openai.com/codex/config-sample) |
| `model_reasoning_effort` | minimal, low, medium, high, xhigh | same |
| `personality` | none, friendly, pragmatic | same |
| `approval_policy` | untrusted, on-request (recommended — model decides when to ask), never | `on-failure` dropped (deprecated by Codex) |
| `sandbox_mode` | read-only, workspace-write, danger-full-access | same |
| `agents.max_threads` | 6 (default), 8, 12, 16 | concurrent sub-agent cap — raise to avoid `agent thread limit reached` |
| `suppress_unstable_features_warning` | auto-set `true` to silence the `plugin_hooks` under-development warning | same |

### MCP API Keys

The setup prompts key by key. Empty input skips a key. Signup URLs are shown as
placeholders. Values are stored in `~/.codex/.env` with `chmod 600` and are
loaded by the shell autoloader.

| Variable | MCP server | Signup |
|---|---|---|
| `CONTEXT7_API_KEY` | context7 documentation lookup | https://context7.com |
| `EXA_API_KEY` | exa web search and research | https://exa.ai |
| `MAGIC_API_KEY` | 21st.dev magic UI generation | https://21st.dev |
| `GEMINI_DESIGN_API_KEY` | gemini-design AI frontend | https://aistudio.google.com/apikey |
| `GITHUB_TOKEN` | GitHub MCP | https://github.com/settings/tokens |

You can pre-export keys before running `setup.sh`; existing environment values
are detected and the prompt is skipped.

### What `setup.sh` Does

1. `bun install` - installer dependencies
2. `codex plugin marketplace add https://github.com/fusengine/codex.git` (or
   direct `~/.codex/config.toml` patch when Codex CLI is unavailable)
3. Enables `[features] hooks=true, plugin_hooks=true` in `~/.codex/config.toml`
4. Copies `AGENTS.md` to `~/.codex/AGENTS.md` with overwrite prompt
5. Enables the 19 plugins (`[plugins."NAME@fusengine-codex"] enabled = true`)
6. Prompts for Codex config and auto-sets `suppress_unstable_features_warning`
7. Prompts for API keys and writes `~/.codex/.env` with `chmod 600`
8. Installs the shell autoloader
9. Resolves `${VAR}` placeholders from plugin `.mcp.json` files into static
   `[mcp_servers.X]` blocks in `~/.codex/config.toml`
10. Prints the final MCP report and missing environment variables

> **Why resolve variables during setup?** Codex CLI 0.130.x does not interpolate
> `${VAR}` in plugin `.mcp.json` files
> ([openai/codex#19582](https://github.com/openai/codex/issues/19582)). The
> configurator resolves values during installation so Codex receives static
> config entries.

## Plugin Inventory

The marketplace `name` matches the folder name (kebab-case, no prefix). Codex
docs require the outer folder name and `plugin.json` name to be the same
normalized plugin name.

| Folder | Manifest name | Version | Description |
|---|---|---|---|
| `ai-pilot` | `ai-pilot` | 1.2.24 | APEX workflow, sniper, research-expert, explore-codebase, websearch |
| `astro-expert` | `astro-expert` | 1.0.6 | Astro 6: Islands, Content Layer, Actions, Server Islands |
| `cartographer` | `cartographer` | 1.0.6 | Auto-generated plugin and project maps |
| `changelog-watcher` | `changelog-watcher` | 1.0.7 | Codex CLI changelog watcher and breaking-change detection |
| `codex-rules` | `codex-rules` | 1.0.7 | Global APEX / SOLID / DRY rules injection |
| `commit-pro` | `commit-pro` | 1.2.16 | Conventional commits, security check, version bump, tag, push |
| `core-guards` | `core-guards` | 1.1.26 | Pre-tool-use safety, SOLID enforcement hooks, statusline |
| `design-expert` | `design-expert` | 2.1.23 | UI designer 7-phase pipeline, OKLCH tokens, Gemini Design MCP |
| `laravel-expert` | `laravel-expert` | 1.2.0 | Laravel 12, Eloquent, Livewire, Reverb, Stripe |
| `memory-neural` | `memory-neural` | 1.0.0 | Persistent neural memory with Graphiti and Qdrant |
| `nextjs-expert` | `nextjs-expert` | 1.1.16 | Next.js 16, RSC, Server Actions, Prisma 7, Better Auth |
| `prompt-engineer` | `prompt-engineer` | 1.1.6 | Prompt and agent design, A/B testing, guardrails |
| `react-expert` | `react-expert` | 1.0.13 | React 19, TanStack Router, Zustand, Testing Library |
| `security-expert` | `security-expert` | 1.0.11 | OWASP Top 10, CVE research, dependency audit, security headers |
| `seo` | `seo` | 1.0.2 | SEO / SEA / GEO 2026, AI Overviews, structured data |
| `shadcn-expert` | `shadcn-expert` | 1.0.10 | shadcn/ui, Radix, Base UI, theming, registries |
| `solid` | `solid` | 1.0.10 | Multi-language SOLID orchestrator |
| `swift-apple-expert` | `swift-apple-expert` | 1.1.12 | Swift 6.2 and SwiftUI for all Apple platforms |
| `tailwindcss` | `tailwindcss` | 1.1.3 | Tailwind v4.1, Oxide engine, OKLCH, container queries |

## Codex CLI Conventions

| Concept | Implementation | Docs |
|---|---|---|
| Plugin manifest | `.codex-plugin/plugin.json` | `developers.openai.com/codex/plugins/build` |
| Plugin name = folder name | enforced via `fix-conformance.ts` | same |
| Marketplace registry | `.agents/plugins/marketplace.json` (`source: {source:"local", path}`) | same |
| Skill | `skills/<name>/SKILL.md` with strict `name` and `description` frontmatter | `developers.openai.com/codex/skills` |
| Subagent | `agents/<name>.toml` with `sandbox_mode` and `developer_instructions` | `developers.openai.com/codex/subagents` |
| Hooks | `hooks/hooks.json` with 6 stable events | `developers.openai.com/codex/hooks` |
| Hook env vars | `${PLUGIN_ROOT}`, `${PLUGIN_DATA}` | same |
| MCP servers | `.mcp.json` direct map, no wrapper, no `type` field | PR #18780 |
| AGENTS.md | Auto-loaded from `~/.codex/AGENTS.md` plus Git root to CWD walk | `developers.openai.com/codex/guides/agents-md` |

### 6 Codex Hook Events

- `SessionStart` - session boot (`startup`, `resume`, `clear`)
- `UserPromptSubmit` - user prompt submission
- `PreToolUse` - before tool execution (matcher = regex on tool name)
- `PostToolUse` - after tool execution
- `PermissionRequest` - when approval is required
- `Stop` - end of turn

Do not register `PreCompact` for plugin hooks until Codex stabilizes it.

### 22 Bundled MCP Servers

**Originals (12):** `exa`, `sequential-thinking`, `context7`, `gemini-design`,
`shadcn`, `magic`, `memory`, `next-devtools`, `graphiti`, `qdrant`,
`XcodeBuildMCP`, `apple-docs`.

**Added in v1.2.0 (+12):** `astro-docs`, `filesystem`, `fuse-browser`,
`postgres`, `github`, `supabase`, `slack`, `sentry`, `stripe`, `notion`,
`brave-search`, `replicate`. They are installable through the interactive
`mcp-select` prompt during setup.

## Layout

```text
codex-plugins/
├── AGENTS.md                          # global Codex rules
├── setup.sh                           # install entry point
├── package.json                       # Bun, type: module
├── tsconfig.json                      # Bun strict
├── .agents/plugins/marketplace.json   # 19-plugin registry
├── plugins/                           # 19 plugins
│   └── <plugin>/
│       ├── .codex-plugin/plugin.json
│       ├── skills/<name>/SKILL.md
│       ├── agents/<name>.toml
│       ├── hooks/hooks.json
│       ├── .mcp.json                  # when MCP servers exist
│       ├── scripts/                   # Bun TS + Bun-to-Python wrappers
│       │   └── _legacy_py/            # archived Python originals
│       └── .cartographer/             # generated maps
└── scripts/                           # Bun tooling
    ├── migrate.ts                     # claude-plugins to codex-plugins
    ├── install-codex.ts               # installer entry
    ├── convert-py-to-bun.ts           # regex-based .py to .ts converter
    ├── fix-conformance.ts             # align manifests/models/marketplace
    ├── fix-real-issues.ts             # fix interfaces/matchers after audit
    ├── fix-legacy-py-paths.ts         # patch ~/.claude to ~/.codex in _legacy_py
    ├── final-conformance.ts           # SKILL.md cleanup and wrappers
    ├── migrate-mcp.ts                 # mcp.json.bak to .mcp.json
    └── lib/
        └── install/                   # runner, marketplace, features, agents-md, enable-plugins, mcp
```

## Known Limitations (Codex CLI 0.130.x)

| Limit | Status |
|---|---|
| `codex plugin add NAME@MARKETPLACE` | Not available in 0.130.0; fallback patches `config.toml` directly |
| Command-backed statusline (`["bun", "/path"]`) | Removed from runtime since PR #10546; feature request open (issue #20244). Statusline code is preserved in `core-guards/statusline/` for future support |
| 134 hook scripts | Bun wrappers call `python3` and preserve Python originals. Native Bun rewrite is pending |

> **`@fusengine/harness` guard on Codex — `git commit`/`git add` and installs
> are hard-denied outside Ralph mode.** Codex has no interactive approval
> channel and does not honor `permissionDecision: "ask"` (it fails open —
> Codex's own `pre_tool_use.rs` test `unsupported_permission_decision_fails_open`),
> so the harness downgrades every `ask` to an explicit deny. As a result
> `git commit`, `git add`, `git checkout -b` (and every `git push` / `checkout` /
> `reset` / `merge` / … confirmation gate) plus project installs (`bun install`,
> `npm install`, `pip install`, …) are **denied** on Codex unless `RALPH_MODE=1`
> is set. Ralph mode exempts only the safe set (`git add`, `git commit`,
> `git checkout -b`, `git status` / `diff` / `log`) and project installs; system
> installs (`brew`, `apt`, …) stay denied even then, and destructive git
> (`push --force`, `reset --hard`, `branch -D`) is always blocked.

## Known Gaps (claude-plugins to codex-plugins parity)

All gaps identified in the v1.1.x parity diff are closed in v1.2.0:

- [x] Codex file backups before modification (`fs-helpers.ts` + `backup.ts`)
- [x] `setup-plugins.ts`: centralized per-plugin install orchestration
- [x] Expanded MCP catalog: +12 servers (`mcp-catalog.ts`, 24 total)
- [x] Dedicated shell environment installers (conf.d / rc append / PowerShell profile)
- [x] Built `dist/` statusline (custom statusline not supported by Codex 0.130; tracked in issue #17827)
- [~] `_shared/`: duplicate `apex_constants.ts` identified versus `apex-constants.ts`; four other snake_case files are confirmed unique. Manual cleanup remains.
- [x] `commit-pro`: assets restored from claude-plugins (`commands/`, `CHANGELOG.md`, `LICENSE`, `README.md`). Hooks were not restored.
- [x] `perf-env.ts`: binary-verified Codex environment prompt (`RUST_LOG`, `CODEX_TUI_ROUNDED`, `GIT_OPTIONAL_LOCKS`)
- [x] `plugin-scanner.ts`: post-install diagnostic report (manifest / hooks / MCP / skills / agents per plugin)

> There is no Codex equivalent for Claude Code performance variables
> (`CLAUDE_CODE_FORK_SUBAGENT`, `CLAUDE_CODE_ATTRIBUTION_HEADER`,
> `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_AUTOUPDATER`). This was
> verified with `strings $(which codex)` on 0.130.0; those symbols do not exist
> in the binary. Codex has no CLI telemetry toggle or autoupdate toggle
> equivalent; telemetry is server-side and upgrades use `codex --upgrade`.
> `perf-env.ts` is limited to the three recognized environment variables.

### `plugin-scanner` Output

```text
Plugin diagnostic (19 plugins scanned):
  ai-pilot              manifest OK  hooks 4 evt / 12 hdl  mcp 2  skills 6  agents 5
  astro-expert          manifest OK  hooks 2 evt /  4 hdl  mcp 1  skills 12 agents 1
  ...
Issues: 0 missing manifest, 0 malformed hooks.json, 0 malformed .mcp.json.
```

## Dev Tools

```bash
bun run migrate                         # regenerate plugins/* from ../claude-plugins/
bun run scripts/convert-py-to-bun.ts    # batch py to ts conversion
bun run scripts/fix-conformance.ts      # align manifests/models/marketplace
bun run scripts/migrate-mcp.ts          # mcp.json.bak to .mcp.json
```

## License

MIT. See [LICENSE](LICENSE) when available.
