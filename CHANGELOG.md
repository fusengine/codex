# Changelog

All notable changes to the Fusengine Codex plugin ecosystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- README : bump v1.1.0, table d'inventaire à 18 plugins, section « Config Codex » documentée.

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
- `AGENTS.md` global rules (Codex equivalent of `CLAUDE.md`, auto-loaded at session start).
- `setup.sh` + `scripts/install-codex.ts` (Bun + `@clack/prompts`) interactive installer.
- Installer steps: marketplace registration, `[features] hooks=true, plugin_hooks=true`, AGENTS.md copy, auto-enable 19 plugins, MCP report.
- 134 Bun → Python wrappers in `plugins/*/scripts/` for hook scripts that couldn't be fully transpiled.
- Original Python source preserved under `plugins/*/scripts/_legacy_py/`.
- `core-guards/statusline/` + `core-guards/song/` directories preserved for future Codex statusline support (issue #20244).

### Changed
- Variable `${CLAUDE_PLUGIN_ROOT}` → `${PLUGIN_ROOT}` (Codex native, with `CLAUDE_PLUGIN_ROOT` alias preserved by Codex runtime).
- Hook event mapping: `SubagentStart` → `SessionStart`, `SubagentStop`/`SessionEnd`/`TaskCompleted` → `Stop`, `PostToolUseFailure` → `PostToolUse`, `InstructionsLoaded` → `SessionStart`.
- Path conventions: `~/.claude/` → `~/.codex/`, `CLAUDE.md` → `AGENTS.md`, `.claude-plugin/` → `.codex-plugin/`.
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
- Hook event enum const: `SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, PermissionRequest, Stop, PreCompact, PostCompact` — all our events covered.
- SessionStart matcher values: `startup, resume, clear` — our hooks use these.
- Env vars `PLUGIN_ROOT, PLUGIN_DATA, CLAUDE_PLUGIN_ROOT, CLAUDE_PLUGIN_DATA` confirmed.
- Manifest paths `.codex-plugin/plugin.json` AND `.claude-plugin/plugin.json` both accepted (legacy compat).

### Tested in production (user's `~/.codex/`)
- `codex exec --skip-git-repo-check "say only OK"` → exit 0, session id, model `gpt-5.3-codex`, no warning, no schema reject.
- Marketplace `fusengine-codex` registered in `~/.codex/config.toml`.
- 19 plugins `[plugins."NAME@fusengine-codex"] enabled = true`.
- SOLID `enforce-file-size` hook emits valid `{"hookSpecificOutput": {"permissionDecision": "deny", ...}}` on 150-line file.
- APEX `require-apex-agents` hook emits valid deny output when explore-codebase/research-expert not invoked.
