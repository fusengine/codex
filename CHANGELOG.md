# Changelog

All notable changes to the Fusengine Codex plugin ecosystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.6] - 2026-05-28

### Fixed

- Codex 0.134 hook read false-positives: `detect-bash-write`/`bash-write-guard` now deny only real writes to code files and allow reads (incl. the `context/mcp` doc cache)
- doc-gate consultation loop: `track-doc-consultation` matcher broadened to Codex tool ids (`web_search_exa`), resolving the infinite re-block on code writes
- MCP cache scripts use substring tool matching; `cache-doc-from-transcript` parses the Codex rollout format so the research doc cache survives `code_mode`
- `track-agent-calls` reads `spawn_agent` `message`/`task` fields
- `memory-neural` ships an empty `.mcp.json` (lab) with the backend config preserved as `.mcp.json.example`
- installer persists `bypass_hook_trust` so re-synced hooks run without an interactive re-trust prompt
- APEX agents/SOLID read TTL raised to 180s; `.ruff_cache` gitignored; README model list aligned (gpt-5.5/5.4)

Bumped: ai-pilot 1.2.25, core-guards 1.1.27, memory-neural 1.0.1 (suite 1.0.1).

## [1.2.5] - 2026-05-17

### Fixed
- `plugins/core-guards/hooks/hooks.json` : 2 références cassées vers fichiers renommés lors de la migration Claude → Codex.
  - `scripts/session-start/inject-codex-md.ts` → `scripts/session-start/inject-agents-md.ts`
  - `scripts/user-prompt/read-codex-md.ts` → `scripts/user-prompt/read-agents-md.ts`
- Conséquence : les hooks `SessionStart` et `UserPromptSubmit` exitaient code 1 (`Module not found "scripts/session-start/inject-codex-md.ts"`) à chaque démarrage de session Codex. Diagnostic reproduit en lançant manuellement `bun scripts/session-start/inject-codex-md.ts` depuis le cache plugin.

## [1.2.5] - 2026-05-17

### Fixed
- **Hook matchers + scripts adaptés pour Codex apply_patch internal tool** :
  - 15 plugin `hooks.json` : `${CODEX_PLUGIN_ROOT}` (n'existe pas dans Codex) → `${PLUGIN_ROOT}` (natif binaire 0.130) via `scripts/fix-plugin-root.ts`.
  - 12 plugin `hooks.json` : matcher `"apply_patch"` → `"Write|Edit|apply_patch"` (anticipation PR #18391 + alias fusengine/codex-agent) via `scripts/fix-apply-patch-matcher.ts`.
  - 5 scripts core-guards adaptés au format V4A apply_patch : `enforce-file-size.py`, `enforce-interfaces.py`, `enforce-gemini-mcp.py`, `require-apex-agents.py`, `require-solid-read.py` parsent désormais `tool_input.command` (raw patch body avec `*** Add/Update/Delete File:` markers) en plus du format Claude `tool_input.file_path`.
- **Renames cassés post-migration Claude → Codex** dans `core-guards/hooks/hooks.json` :
  - `scripts/session-start/inject-codex-md.ts` → `scripts/session-start/inject-agents-md.ts`
  - `scripts/user-prompt/read-codex-md.ts` → `scripts/user-prompt/read-agents-md.ts`
  - Corrige les "SessionStart hook (failed) exit code 1" + "UserPromptSubmit hook (failed) exit code 1" loggés à chaque session start.
- `codex-rules/scripts/inject-rules.ts` : wrapper Bun→Python forward maintenant `process.argv.slice(2)` (avant : args droppés → "Missing plugin root argument"). Fallback `PLUGIN_ROOT` env si argv vide.

### Notes
- **Codex 0.130 ne fire toujours PAS PreToolUse/PostToolUse sur apply_patch** (issue #16732, PR #18391 merged à main mais absente de cette release). Les 5 scripts enforce/require sont prêts à intercepter dès qu'une release contient le fix. Vérifiable via `~/.codex/fusengine/logs/enforce-file-size.log` (créé au premier fire réel).
- Référence : `fusengine/codex-agent` utilise matcher `Write|Edit` standalone → **aussi affecté par #16732 en 0.130** (vérifié empirique : leur `check-solid-from-transcript.py` filtre `name in ("Write","Edit")`, skip aussi le nom Codex `apply_patch`).

## [1.2.4] - 2026-05-17

### Fixed
- `~/.codex/.env` est désormais l'**unique source de vérité** pour les clés API MCP. Drop du fallback `process.env` à 3 endroits :
  - `mcp-select.ts:hasKey()` : ne checke plus que `env[apiKeyEnv]` → un MCP avec clé absente de `.env` montre `⚠ no key` même si exporté dans le shell.
  - `mcp-key-prompt.ts:missing filter` : prompt déclenché si clé absente de `.env`, même si shell l'a → toutes les clés finissent saisies et sauvegardées dans `.codex/.env` (chmod 600).
  - `mcp-configurator.ts:resolveStr()` : `${VAR}` résolus uniquement depuis `.env` → garantit que les valeurs écrites dans `config.toml` viennent de la source persistée, pas d'un shell volatile.
- Conséquence : les clés exportées dans `~/.codex/.env` (ou `~/.config/fish/config.fish`, etc.) ne **leakent plus** dans la config Codex via process.env. Migration : à la première install après v1.2.4, l'installeur prompt pour toutes les clés et les sauve dans `~/.codex/.env`.

## [1.2.3] - 2026-05-17

### Fixed
- **12 plugin `.mcp.json` alignés byte-identique sur `claude-plugins/scripts/mcp/mcp.json`** (single source of truth, vérifié via `jq` lignes 86-136). Plugins concernés : ai-pilot, design-expert, nextjs-expert, react-expert, tailwindcss, laravel-expert, prompt-engineer, security-expert, shadcn-expert, solid, swift-apple-expert, changelog-watcher.
- **context7** : `${CONTEXT7_API_KEY}` passé en flag CLI `--api-key` dans `args` (forme prioritaire d'après doc context7.com), drop `env` block.
- **exa** : `${EXA_API_KEY}` inline dans l'URL `&exaApiKey=…`, drop `env_http_headers` (match claude-plugins HTTP form).
- **magic** : env var interne `API_KEY` → `MAGIC_API_KEY` (= claude reference + nom attendu par `@21st-dev/magic`).
- **gemini-design** (5 plugins, déjà v1.2.2 catalog) : env interne `GEMINI_API_KEY` → `API_KEY`, shell ref `${GEMINI_API_KEY}` → `${GEMINI_DESIGN_API_KEY}` (= claude reference + ce que `gemini-design-mcp` lit).

### Notes
- `promptMissingKeys` (v1.2.1) demande désormais `GEMINI_DESIGN_API_KEY` au lieu de `GEMINI_API_KEY`. Si tu avais déjà exporté `GEMINI_API_KEY` dans ton shell, renomme-la (ou laisse l'installeur t'en redemander une dans `~/.codex/.env`).

## [1.2.2] - 2026-05-17

### Fixed
- `scripts/lib/install/mcp-catalog.ts` : alignement byte-identique avec `claude-plugins/scripts/mcp/mcp.json` (référence).
  - Drop `graphiti` + `qdrant` du catalogue installable (absents de claude-plugins ; ils crashaient au démarrage de Codex avec `empty host` car les `${URL_*}` n'étaient jamais résolus depuis `memory-neural/.mcp.json`).
  - `gemini-design` : `apiKeyEnv` `GEMINI_API_KEY` → `GEMINI_DESIGN_API_KEY`, `apiKeyUrl` → `https://gemini-design-mcp.com`.
  - Catalogue final : **22 MCPs** (= claude-plugins 1:1), au lieu de 24.

## [1.2.1] - 2026-05-17

### Fixed
- `scripts/lib/install/mcp-key-prompt.ts` : **ajouté pour de vrai** (le v1.2.0 prétendait l'avoir mais le fichier n'avait jamais été écrit). Port direct de `claude-plugins/scripts/src/services/mcp-key-prompt.ts` — prompt uniquement les clés des MCPs sélectionnés, après la multiselect.
- `scripts/lib/install/runner-finalize.ts` : enchaîne maintenant `selectMcpServers` → `promptMissingKeys(selected)` → `configureMcpServers`. Avant : configure direct sans demander les clés manquantes du subset choisi.
- `scripts/lib/install/runner.ts` : drop l'appel `promptApiKeys` upfront (et son import). Avant : l'installeur demandait TOUTES les clés API du catalogue avant même que l'utilisateur ait choisi quels MCPs activer — exactement l'inverse du flow claude-plugins.

## [1.2.0] - 2026-05-17

### Added — parity with claude-plugins installer

- `scripts/lib/install/backup.ts` + `fs-helpers.ts` : snapshot `~/.codex/config.toml` + `~/.codex/.env` + `~/.codex/AGENTS.md` avant modification, restoration on failure.
- `scripts/lib/install/setup-plugins.ts` : orchestration centralisée des étapes plugin par plugin (manifest validation, agents.toml install, hooks wiring, MCP merge), pilotée par `runner.ts`.
- `scripts/lib/install/mcp-catalog.ts` : +12 serveurs MCP au catalogue installable (`astro-docs`, `filesystem`, `playwright`, `postgres`, `github`, `supabase`, `slack`, `sentry`, `stripe`, `notion`, `brave-search`, `replicate`) — total 24 MCPs.
- `scripts/lib/install/env-shell.ts` (+ helpers fish/zsh/bash/pwsh) : installateurs shell auto-loader extraits du runner, idempotents avec markers.
- `scripts/lib/install/perf-env.ts` : prompt interactif `@clack/prompts` pour les toggles env Codex **binary-verified** (`RUST_LOG=error`, `CODEX_TUI_ROUNDED=1`, `GIT_OPTIONAL_LOCKS=0`) persistés dans `~/.codex/.env`. Marqueur `_FUSENGINE_PERF_ASKED` pour skip re-prompt. **Pas d'équivalent Codex** pour `CLAUDE_CODE_FORK_SUBAGENT` / `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` / `DISABLE_AUTOUPDATER` — vérifié via `strings $(which codex)` 0.130.0.
- `scripts/lib/install/plugin-scanner.ts` : scan `plugins/*/hooks/hooks.json` + `.mcp.json` + manifest, retourne `PluginInfo[]` (counts events / handlers / mcp servers / skills / agents). Rapport diagnostic affiché en fin de `runner.ts` après `reportMcp`.
- `plugins/core-guards/statusline/dist/` : build statusline préservée pour quand/si le runtime Codex ajoutera le support des statuslines custom (suivi : issue #17827, parent open, aucun PR — statusline custom NON supporté par Codex 0.130).

### Changed

- `scripts/lib/install/runner.ts` : ajout étape `promptPerfEnv` (entre shell-install et MCP) et rapport `scanPlugins` en fin de pipeline après `reportMcp`.
- `plugins/core-guards/statusline/_shared/` : analyse de doublons effectuée — seul `apex_constants.ts` est un vrai doublon de `apex-constants.ts` (renommage snake/kebab). Les 4 autres fichiers snake_case (`cache_compactor.ts`, `cache_io.ts`, `mcp_response.ts`, `state_manager.ts`) sont uniques, pas de doublon. Aucune suppression effectuée (action bloquée).
- `plugins/commit-pro/` : restauration des assets perdus à la migration claude→codex initiale — `commands/` (10 fichiers), `CHANGELOG.md`, `LICENSE`, `README.md`. Pas de hooks restaurés à ce stade.
- README v1.2.0 : section « Manques connus » → tout coché, liste des 12 MCPs ajoutés (24 total), exemple output `plugin-scanner`.

### Notes

- Codex CLI n'a **aucun** équivalent des perf vars Claude Code (`CLAUDE_CODE_FORK_SUBAGENT`, `CLAUDE_CODE_ATTRIBUTION_HEADER`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_AUTOUPDATER`) — confirmé via `strings $(which codex)` 0.130.0. Pas de toggle telemetry ni autoupdate côté CLI (telemetry server-side / account settings). `perf-env.ts` se limite donc aux 3 vars Codex réellement reconnues par le binaire : `RUST_LOG`, `CODEX_TUI_ROUNDED`, `GIT_OPTIONAL_LOCKS`.

## [1.1.2] - 2026-05-17

### Fixed
- `swift-apple-expert/skills/tvos/SKILL.md` : force rewrite pour invalider un inode stale chez Codex CLI (warning "No such file or directory" sur fichier existant et valide après `Bun.write` qui fait unlink+create).

## [1.1.1] - 2026-05-17

### Fixed
- `runner.ts` : skip `codex plugin marketplace add` quand le marketplace est déjà registered dans `~/.codex/config.toml` (conflit `source_type git` vs `local` quand setup.sh est lancé depuis le path tmp auto-cloné par Codex après install via TUI).

## [1.1.0] - 2026-05-17

### Added
- `scripts/lib/install/config-prompt.ts` : prompt interactif `@clack/prompts` pour `model`, `model_reasoning_effort`, `personality`, `approval_policy`, `sandbox_mode`. Auto-set `suppress_unstable_features_warning = true` à la racine de `config.toml`.
- `scripts/fix-warnings.ts` : quote le frontmatter `description`/`when-to-use`/`keywords` dans 186 SKILL.md et purge 5 manifests pointant sur des fichiers/dossiers manquants. Applique au repo + cache `~/.codex/plugins/cache/`.

### Changed
- `marketplace.json` : aligne les 18 plugin names sur folder name (drop préfixe `fuse-`) conformément à la doc Codex (*"Outer folder name and plugin.json name are always the same"*). Drop `$schema`.
- `scripts/fix-conformance.ts:fixMarketplace()` : dérive `name` depuis `source.path` au lieu de garder `p.name` (alignement idempotent).
- `scripts/lib/install/features.ts` : auto-injecte `suppress_unstable_features_warning = true` via nouvel helper `ensureRootKey()`.
- `scripts/lib/install/runner.ts` : wire `promptCodexConfig` entre `maybeInstallPlugins` et `promptApiKeys`.
- README : bump v1.1.0, table d'inventaire à 19 plugins, section « Config Codex » documentée.

### Removed
- Plugin `memory-neural` (encore en dev) — retiré de `marketplace.json`, `CATEGORY_OF`, et `~/.codex/config.toml`.

## [1.0.0] - 2026-05-15

### Added
- Initial migration from `claude-plugins/` → `codex-plugins/` (19 plugins).
- `.codex-plugin/plugin.json` manifests for all 19 plugins (folder name = manifest `name`).
- `agents/<name>.toml` Codex subagent definitions (TOML, model + sandbox_mode + developer_instructions).
- `skills/<name>/SKILL.md` skills with strict frontmatter (`name`, `description` only — per Codex spec).
- `hooks/hooks.json` per plugin with 6 Codex official events (`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Stop`).
- `.mcp.json` per plugin (14 plugins) — Codex format (direct map, no `type` field, `http_headers` for HTTP servers).
- `.agents/plugins/marketplace.json` Codex marketplace registry with object-form `source: {source:"local", path}`, `policy.installation`, `policy.authentication`, `category`, `interface`.
- `AGENTS.md` global rules (Codex equivalent of `AGENTS.md`, auto-loaded at session start).
- `setup.sh` + `scripts/install-codex.ts` (Bun + `@clack/prompts`) interactive installer.
- Installer steps: marketplace registration, `[features] hooks=true, plugin_hooks=true`, AGENTS.md copy, auto-enable 19 plugins, MCP report.
- 134 Bun → Python wrappers in `plugins/*/scripts/` for hook scripts that couldn't be fully transpiled.
- Original Python source preserved under `plugins/*/scripts/_legacy_py/`.
- `core-guards/statusline/` + `core-guards/song/` directories preserved for future Codex statusline support (issue #20244).

### Changed
- Variable `${PLUGIN_ROOT}` → `${PLUGIN_ROOT}` (Codex native, with `PLUGIN_ROOT` alias preserved by Codex runtime).
- Hook event mapping: `SubagentStart` → `SessionStart`, `SubagentStop`/`SessionEnd`/`TaskCompleted` → `Stop`, `PostToolUseFailure` → `PostToolUse`, `InstructionsLoaded` → `SessionStart`.
- Path conventions: `~/.codex/` → `~/.codex/`, `AGENTS.md` → `AGENTS.md`, `.claude-plugin/` → `.codex-plugin/`.
- Agent models migrated to documented Codex model names (`gpt-5.3-codex-spark`, `gpt-5.4`, `gpt-5.4-mini`).
- 137 Python scripts converted to Bun TypeScript stubs (regex-based transpilation), then 134 replaced with Bun→Python wrappers when syntax was incompatible.
- MCP servers `headers` → `http_headers`, no `type: "stdio"` field (inferred by Codex from `command`/`url`).

### Removed
- All "Claude" string references in active plugin files (except `ClaudeBot` user-agent in `seo/templates/robots/robots-saas.txt` which is a legitimate web crawler identifier).
- Invented manifest interface fields (`cli`, `ide`) replaced with documented `{displayName, shortDescription, developerName}`.
- Invalid `SessionStart` matchers (`"sniper"`, `"explore-codebase"`) replaced with empty matcher (Codex matches source = `startup`/`resume`/`clear` only).

### Validated against binary `codex-aarch64-apple-darwin` 0.130.0
- `VALID_AUTH_POLICIES = {"ON_INSTALL", "ON_USE"}` — our value `"ON_INSTALL"` is default.
- `VALID_INSTALL_POLICIES = {"NOT_AVAILABLE", "AVAILABLE", "INSTALLED_BY_DEFAULT"}` — our value `"AVAILABLE"` is default.
- Hook event enum const includes `PreCompact` / `PostCompact`, but plugins now register only stable events: `SessionStart`, `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `PermissionRequest`, `Stop`.
- SessionStart matcher values: `startup, resume, clear` — our hooks use these.
- Env vars `PLUGIN_ROOT, PLUGIN_DATA, PLUGIN_ROOT, CLAUDE_PLUGIN_DATA` confirmed.
- Manifest paths `.codex-plugin/plugin.json` AND `.claude-plugin/plugin.json` both accepted (legacy compat).

### Tested in production (user's `~/.codex/`)
- `codex exec --skip-git-repo-check "say only OK"` → exit 0, session id, model `gpt-5.3-codex`, no warning, no schema reject.
- Marketplace `fusengine-codex` registered in `~/.codex/config.toml`.
- 19 plugins `[plugins."NAME@fusengine-codex"] enabled = true`.
- SOLID `enforce-file-size` hook emits valid `{"hookSpecificOutput": {"permissionDecision": "deny", ...}}` on 150-line file.
- APEX `require-apex-agents` hook emits valid deny output when explore-codebase/research-expert not invoked.
