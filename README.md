# Fusengine Codex Plugins

![version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![plugins](https://img.shields.io/badge/plugins-19-brightgreen?style=flat-square)
![runtime](https://img.shields.io/badge/runtime-Bun-black?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

> **Codex CLI plugin marketplace.** 19 expert plugins (APEX workflow, SOLID/DRY enforcement, framework specialists, MCP integrations) conformes à la doc officielle Codex CLI (`developers.openai.com/codex`).

## Installation (3 commandes)

```bash
git clone https://github.com/fusengine/codex.git
cd codex
./setup.sh           # macOS / Linux
# .\setup.ps1        # Windows
```

C'est tout. Le script installe les dépendances Bun, enregistre le marketplace, active les hooks, copie `AGENTS.md` et active les 19 plugins.

**Prérequis** : [Bun](https://bun.sh) et [codex CLI](https://developers.openai.com/codex/cli) 0.130+.

### Variables d'environnement MCP (optionnel)

À exporter **avant** `./setup.sh` pour activer les MCP correspondants :

```bash
export GEMINI_DESIGN_API_KEY="..."   # design-expert
export CONTEXT7_API_KEY="..."        # documentation lookup
export EXA_API_KEY="..."             # web search
export MAGIC_API_KEY="..."           # 21st.dev components
export NEURAL_MEMORY_HOST="..."      # memory-neural (Graphiti/Qdrant)
```

Le setup affiche un rapport en fin d'install indiquant exactement quelles variables sont manquantes.

### Ce que fait `setup.sh`

1. `bun install` — installe les deps de l'installer
2. `codex plugin marketplace add ./` (ou patch `~/.codex/config.toml` si codex CLI absent)
3. Active `[features] hooks=true, plugin_hooks=true` dans `~/.codex/config.toml`
4. Copie `AGENTS.md` → `~/.codex/AGENTS.md` (prompt overwrite si existant)
5. Auto-active les 19 plugins (`[plugins."NAME@fusengine-codex"] enabled = true`)
6. Rapport MCP + env vars manquantes

## Inventaire des 19 plugins

| Folder | Manifest name | Version | Description |
|---|---|---|---|
| `ai-pilot` | `ai-pilot` | 1.2.24 | APEX workflow, sniper, research-expert, explore-codebase, websearch |
| `astro-expert` | `astro-expert` | 1.0.6 | Astro 6 — Islands, Content Layer, Actions, Server Islands |
| `cartographer` | `cartographer` | 1.0.6 | Auto-generated plugin & project maps |
| `changelog-watcher` | `changelog-watcher` | 1.0.7 | Codex CLI changelog watcher + breaking-change detection |
| `codex-rules` | `codex-rules` | 1.0.7 | Global APEX / SOLID / DRY rules injection |
| `commit-pro` | `commit-pro` | 1.2.16 | Conventional commits, security check, version bump, tag, push |
| `core-guards` | `core-guards` | 1.1.26 | Pre-tool-use safety + SOLID enforcement hooks + statusline |
| `design-expert` | `design-expert` | 2.1.23 | UI designer 7-phase pipeline + OKLCH tokens + Gemini Design MCP |
| `laravel-expert` | `laravel-expert` | 1.2.0 | Laravel 12, Eloquent, Livewire, Reverb, Stripe |
| `memory-neural` | `memory-neural` | 1.0.0 | Bio-inspired memory (Graphiti + Qdrant) |
| `nextjs-expert` | `nextjs-expert` | 1.1.16 | Next.js 16, RSC, Server Actions, Prisma 7, Better Auth |
| `prompt-engineer` | `prompt-engineer` | 1.1.6 | Prompt + agent design, A/B testing, guardrails |
| `react-expert` | `react-expert` | 1.0.13 | React 19, TanStack Router, Zustand, Testing Library |
| `security-expert` | `security-expert` | 1.0.11 | OWASP Top 10, CVE research, dependency audit, security headers |
| `seo` | `seo` | 1.0.2 | SEO / SEA / GEO 2026, AI Overviews, structured data |
| `shadcn-expert` | `shadcn-expert` | 1.0.10 | shadcn/ui (Radix + Base UI), theming, registries |
| `solid` | `solid` | 1.0.10 | Multi-language SOLID orchestrator |
| `swift-apple-expert` | `swift-apple-expert` | 1.1.12 | Swift 6.2 + SwiftUI for all Apple platforms |
| `tailwindcss` | `tailwindcss` | 1.1.3 | Tailwind v4.1 — Oxide engine, OKLCH, container queries |

## Conventions Codex CLI utilisées

| Concept | Implémentation | Source doc |
|---|---|---|
| Plugin manifest | `.codex-plugin/plugin.json` | `developers.openai.com/codex/plugins/build` |
| Plugin name = folder name | enforced via `fix-conformance.ts` | id. |
| Marketplace registry | `.agents/plugins/marketplace.json` (objet `source: {source:"local", path}`) | id. |
| Skill | `skills/<name>/SKILL.md` (frontmatter strict: `name`, `description`) | `developers.openai.com/codex/skills` |
| Subagent | `agents/<name>.toml` (TOML, `sandbox_mode`, `developer_instructions`) | `developers.openai.com/codex/subagents` |
| Hooks | `hooks/hooks.json` — 6 events officiels | `developers.openai.com/codex/hooks` |
| Hook env vars | `${PLUGIN_ROOT}`, `${PLUGIN_DATA}` (alias `${CLAUDE_PLUGIN_ROOT}` préservé) | id. |
| MCP servers | `.mcp.json` (direct map, pas de wrapper, pas de `type` field) | PR #18780 |
| AGENTS.md | Auto-loaded depuis `~/.codex/AGENTS.md` + walk git root → CWD | `developers.openai.com/codex/guides/agents-md` |

### 6 hook events Codex utilisés
- `SessionStart` — au boot d'une session (matcher : `startup`, `resume`, `clear`)
- `UserPromptSubmit` — submission du prompt utilisateur
- `PreToolUse` — avant exécution d'un tool (matcher = regex sur tool name)
- `PostToolUse` — après exécution
- `PermissionRequest` — quand approbation requise
- `Stop` — fin de turn

`PreCompact` est dans le schéma mais pas encore stabilisé.

### 12 MCP servers bundlés

`exa`, `sequential-thinking`, `context7`, `gemini-design`, `shadcn`, `magic`, `memory`, `next-devtools`, `graphiti`, `qdrant`, `XcodeBuildMCP`, `apple-docs`.

## Layout

```
codex-plugins/
├── AGENTS.md                          ← règles globales Codex
├── setup.sh                           ← entry point install
├── package.json                       ← Bun, type: module
├── tsconfig.json                      ← Bun strict
├── .agents/plugins/marketplace.json   ← registre 19 plugins
├── plugins/                           ← 19 plugins
│   └── <plugin>/
│       ├── .codex-plugin/plugin.json
│       ├── skills/<name>/SKILL.md
│       ├── agents/<name>.toml
│       ├── hooks/hooks.json
│       ├── .mcp.json                  ← si MCP servers
│       ├── scripts/                   ← Bun TS + Bun→Python wrappers
│       │   └── _legacy_py/            ← originaux Python (archive)
│       └── .cartographer/             ← maps auto
└── scripts/                           ← outillage Bun
    ├── migrate.ts                     ← claude-plugins → codex-plugins
    ├── install-codex.ts               ← entry installer
    ├── convert-py-to-bun.ts           ← transpileur regex .py → .ts
    ├── fix-conformance.ts             ← align manifests/models/marketplace
    ├── fix-real-issues.ts             ← fix interface/matchers post-audit
    ├── fix-legacy-py-paths.ts         ← patch ~/.claude → ~/.codex dans _legacy_py
    ├── final-conformance.ts           ← SKILL.md cleanup + wrappers
    ├── migrate-mcp.ts                 ← mcp.json.bak → .mcp.json Codex
    └── lib/
        └── install/                   ← runner, marketplace, features, agents-md, enable-plugins, mcp
```

## Limitations connues (Codex CLI 0.130.x)

| Limite | Statut |
|---|---|
| `codex plugin add NAME@MARKETPLACE` | Pas dispo en 0.130.0 — fallback via patch direct `config.toml` |
| Statusline command-backed (`["bun", "/path"]`) | Retiré du runtime depuis PR #10546 — feature request ouverte (issue #20244). Code statusline préservé dans `core-guards/statusline/` pour quand ça reviendra |
| 134 scripts hook | Wrappers Bun → `python3` (preserves Python originals). Réécriture native Bun à venir |

## Outils dev

```bash
bun run migrate            # re-générer plugins/* depuis ../claude-plugins/
bun run scripts/convert-py-to-bun.ts    # py → ts batch
bun run scripts/fix-conformance.ts      # align manifests/models/marketplace
bun run scripts/migrate-mcp.ts          # mcp.json.bak → .mcp.json Codex
```

## License

MIT — voir [LICENSE](LICENSE) (à venir).
