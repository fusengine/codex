# Fusengine Codex Plugins

![version](https://img.shields.io/badge/version-1.2.0-blue?style=flat-square)
![plugins](https://img.shields.io/badge/plugins-18-brightgreen?style=flat-square)
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

C'est tout. Le script installe les dépendances, enregistre le marketplace, active les hooks, copie `AGENTS.md`, active les 19 plugins, **prompte interactivement la config Codex** (model, reasoning effort, personality, approval policy, sandbox mode) et **les clés API MCP**, installe un **auto-loader shell** (`~/.config/fish/conf.d/codex-env.fish` ou `~/.zshrc`/`~/.bashrc`/profile PowerShell) et résout les `${VAR}` des plugins dans `~/.codex/config.toml`.

**Prérequis** : [Bun](https://bun.sh) et [codex CLI](https://developers.openai.com/codex/cli) 0.130+.

### Config Codex (proposée interactivement à l'install)

Le setup propose les clés top-level de `~/.codex/config.toml`. `(skip)` garde la valeur existante.

| Clé | Valeurs | Source doc |
|---|---|---|
| `model` | gpt-5.5, gpt-5.4, gpt-5.4-mini, gpt-5-pro | [config-sample](https://developers.openai.com/codex/config-sample) |
| `model_reasoning_effort` | minimal, low, medium, high, xhigh | id. |
| `personality` | none, friendly, pragmatic | id. |
| `approval_policy` | untrusted, on-request, never | id. |
| `sandbox_mode` | read-only, workspace-write, danger-full-access | id. |
| `suppress_unstable_features_warning` | auto-set `true` (silence le warning `plugin_hooks` under-dev) | id. |

### Clés API MCP (proposées interactivement à l'install)

Le setup demande clé par clé (skip = Entrée vide). URLs d'inscription affichées en placeholder. Stockées dans `~/.codex/.env` (chmod 600), auto-sourcées par le shell loader.

| Variable | Serveur MCP | Inscription |
|---|---|---|
| `CONTEXT7_API_KEY` | context7 — documentation lookup | https://context7.com |
| `EXA_API_KEY` | exa — web search & research | https://exa.ai |
| `MAGIC_API_KEY` | 21st.dev magic — UI generation | https://21st.dev |
| `GEMINI_API_KEY` | gemini-design — AI frontend | https://aistudio.google.com/apikey |
| `GITHUB_TOKEN` | GitHub MCP | https://github.com/settings/tokens |

Tu peux aussi pré-exporter avant `./setup.sh` — les clés déjà présentes dans l'env sont détectées et le prompt skip.

### Ce que fait `setup.sh` (pipeline complet)

1. `bun install` — deps de l'installer
2. `codex plugin marketplace add ./` (ou patch `~/.codex/config.toml` si codex CLI absent)
3. Active `[features] hooks=true, plugin_hooks=true` dans `~/.codex/config.toml`
4. Copie `AGENTS.md` → `~/.codex/AGENTS.md` (prompt overwrite si existant)
5. Auto-active les 19 plugins (`[plugins."NAME@fusengine-codex"] enabled = true`)
6. **Prompt interactif config Codex** (model, reasoning_effort, personality, approval_policy, sandbox_mode) + auto-set `suppress_unstable_features_warning = true`
7. **Prompt interactif** des clés API → `~/.codex/.env` (chmod 600)
8. **Installe l'auto-loader shell** (fish conf.d / append rc / pwsh profile)
9. **Résout les `${VAR}`** des plugin `.mcp.json` et écrit blocs `[mcp_servers.X]` statiques dans `~/.codex/config.toml` (entre markers idempotents)
10. Rapport MCP final + env vars manquantes

> **Pourquoi cette résolution ?** Codex CLI 0.130.x ne fait pas d'interpolation `${VAR}` dans les plugin `.mcp.json` ([openai/codex#19582](https://github.com/openai/codex/issues/19582)). Le configurator résout côté install pour écrire des valeurs statiques que Codex consomme directement.

## Inventaire des 19 plugins

Le `name` du marketplace correspond au folder name (kebab-case, sans préfixe). Cf doc Codex : *"Outer folder name and `plugin.json` name are always the same normalized plugin name"*.

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
| `memory-neural` | `memory-neural` | 1.0.0 | Persistent neural memory with Graphiti + Qdrant |
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
| Hook env vars | `${PLUGIN_ROOT}`, `${PLUGIN_DATA}` | id. |
| MCP servers | `.mcp.json` (direct map, pas de wrapper, pas de `type` field) | PR #18780 |
| AGENTS.md | Auto-loaded depuis `~/.codex/AGENTS.md` + walk git root → CWD | `developers.openai.com/codex/guides/agents-md` |

### 6 hook events Codex utilisés
- `SessionStart` — au boot d'une session (matcher : `startup`, `resume`, `clear`)
- `UserPromptSubmit` — submission du prompt utilisateur
- `PreToolUse` — avant exécution d'un tool (matcher = regex sur tool name)
- `PostToolUse` — après exécution
- `PermissionRequest` — quand approbation requise
- `Stop` — fin de turn

`PreCompact` ne doit pas être enregistré par les plugins tant que l'événement
n'est pas stabilisé côté Codex.

### 24 MCP servers bundlés

**Originaux (12)** : `exa`, `sequential-thinking`, `context7`, `gemini-design`, `shadcn`, `magic`, `memory`, `next-devtools`, `graphiti`, `qdrant`, `XcodeBuildMCP`, `apple-docs`.

**Ajoutés v1.2.0 (+12)** : `astro-docs`, `filesystem`, `playwright`, `postgres`, `github`, `supabase`, `slack`, `sentry`, `stripe`, `notion`, `brave-search`, `replicate` — installables via le prompt interactif `mcp-select` au setup.

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

## Manques connus (parité claude-plugins → codex-plugins)

Tous les manques identifiés au diff de parité v1.1.x sont désormais comblés en v1.2.0 :

- [x] **Backup** des fichiers Codex avant modification (`fs-helpers.ts` + `backup.ts`)
- [x] **`setup-plugins.ts`** : orchestration centralisée des étapes d'install plugin par plugin
- [x] **Catalogue MCP étendu** : +12 serveurs (`mcp-catalog.ts`, voir liste ci-dessus, 24 au total)
- [x] **Installateurs env shell** dédiés (`env-shell` installers, conf.d / rc append / pwsh profile)
- [x] **Statusline `dist/`** buildée (statusline custom non supporté par Codex 0.130, suivi issue #17827)
- [~] **`_shared/`** : doublon `apex_constants.ts` identifié (vs `apex-constants.ts`) ; 4 autres snake_case (`cache_compactor`, `cache_io`, `mcp_response`, `state_manager`) confirmés uniques. Suppression bloquée — à traiter manuellement.
- [x] **`commit-pro`** : assets restaurés depuis claude-plugins — `commands/` (10), `CHANGELOG.md`, `LICENSE`, `README.md`. (Hooks non restaurés.)
- [x] **`perf-env.ts`** : prompt interactif env Codex **binary-verified** (`RUST_LOG`, `CODEX_TUI_ROUNDED`, `GIT_OPTIONAL_LOCKS`)
- [x] **`plugin-scanner.ts`** : rapport diagnostic post-install (manifest / hooks / MCP / skills / agents par plugin)

> **Pas d'équivalent Codex** pour les perf vars Claude Code (`CLAUDE_CODE_FORK_SUBAGENT`, `CLAUDE_CODE_ATTRIBUTION_HEADER`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_AUTOUPDATER`). Vérifié via `strings $(which codex)` 0.130.0 — ces symboles n'existent pas dans le binaire. Pas de toggle telemetry ni autoupdate côté CLI Codex (telemetry server-side, autoupdate via `codex --upgrade`). `perf-env.ts` se limite donc aux 3 env vars réellement reconnues.

### Output `plugin-scanner` (fin d'install)

```
Plugin diagnostic (19 plugins scanned):
  ai-pilot              manifest ✓  hooks 4 evt / 12 hdl  mcp 2  skills 6  agents 5
  astro-expert          manifest ✓  hooks 2 evt /  4 hdl  mcp 1  skills 12 agents 1
  ...
Issues : 0 missing manifest, 0 malformed hooks.json, 0 malformed .mcp.json.
```

## Outils dev

```bash
bun run migrate            # re-générer plugins/* depuis ../claude-plugins/
bun run scripts/convert-py-to-bun.ts    # py → ts batch
bun run scripts/fix-conformance.ts      # align manifests/models/marketplace
bun run scripts/migrate-mcp.ts          # mcp.json.bak → .mcp.json Codex
```

## License

MIT — voir [LICENSE](LICENSE) (à venir).
