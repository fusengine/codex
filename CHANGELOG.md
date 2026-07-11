# Changelog

## [1.0.32] - 2026-07-11

- feat(agents): migrate all 34 agent TOMLs across 21 plugins to gpt-5.6 models (opus tier -> gpt-5.6-sol, sonnet/haiku tiers and default -> gpt-5.6-terra; gpt-5.5 now legacy-remapped); reasoning effort forced to "high" for all agents (EFFORT_MAP flattening removed)
- feat(installer): model picker driven by the live model-catalog RPC with per-model reasoning efforts (config-model-options.ts); configured model kept when discovery fails
- fix(installer): max_concurrent_threads_per_session preserved when already configured; native V2 tools moved from the failing collaboration namespace to fusengine_agents with spawn metadata exposed for exact custom-agent selection; TOML table edits split into toml-table-helpers.ts with dedicated tests
- chore(release): bump 21 touched plugins + suite to 1.0.32

## [1.0.31] - 2026-07-10

- chore(deps): bump @fusengine/harness to ^0.1.66 — plain git push now auto-approved under Codex approval_policy=never (destructive forms still deny); .gitignore aligned on harness conventions (.harness/, /MEMORY/)
- chore(release): bump suite to 1.0.31

## [1.0.30] - 2026-07-10

- feat(installer): enable MultiAgentV2 by default, migrate incompatible legacy agent limits, and remove the obsolete thread prompt
- chore(release): bump suite to 1.0.30

## [1.0.29] - 2026-07-10

- fix(hooks): every plugin hooks.json command now uses a quoted `"${CODEX_HOME:-$HOME/.codex}"` (22 plugins) — hooks no longer break when CODEX_HOME is unset or the path contains spaces; hooks-rewrite/validate updated + new hooks-validation checks with tests
- feat(install): dynamic Codex model catalog fetched over RPC (scripts/lib/install/model-catalog.ts, replaces the hardcoded model list), config choices extracted to config-options.ts, config-prompt takes an injectable model loader — with tests
- chore(deps): @fusengine/harness ^0.1.65 (approval_policy=never handling, .codex config/rules write-protection, visible deny notices, Linux stdin fix)
- chore(release): bump 22 plugin versions + suite to 1.0.29

## [1.0.28] - 2026-07-09

- feat(core-guards): SessionStart hook resyncs agent TOMLs (and repairs command symlinks) from the latest cached plugin version at every startup/resume/clear — silent, fail-open, fingerprint fast-path, inter-process lock (core-guards 1.1.46)
- chore(deps): typescript ^7.0.2, @fusengine/harness ^0.1.62
- chore(release): bump core-guards + suite to 1.0.28

## [1.0.27] - 2026-07-08

- feat(agents): reference fuse-browser alongside Context7/Exa across agent tooling (21 plugins)
- chore(release): bump 21 plugin versions + suite to 1.0.27

## [1.0.26] - 2026-07-08

### Added
- feat(ai-pilot): port Codex plugin agents and skills (ai-pilot 1.2.39)
- feat(astro-expert): port Codex plugin agents and skills (astro-expert 1.0.10)
- feat(cartographer): port Codex plugin agents and skills (cartographer 1.0.11)
- feat(changelog-watcher): port Codex plugin agents and skills (changelog-watcher 1.0.13)
- feat(codex-rules): port Codex plugin agents and skills (codex-rules 1.0.16)
- feat(commit-pro): port Codex plugin agents and skills (commit-pro 1.2.23)
- feat(core-guards): port Codex plugin agents and skills (core-guards 1.1.45)
- feat(design-expert): port Codex plugin agents and skills (design-expert 2.1.30)
- feat(go-expert): port Codex plugin agents and skills (go-expert 1.0.3)
- feat(laravel-expert): port Codex plugin agents and skills (laravel-expert 1.2.6)
- feat(lessons): port Codex plugin agents and skills (lessons 1.0.3)
- feat(memory-neural): port Codex plugin agents and skills (memory-neural 1.0.6)
- feat(nextjs-expert): port Codex plugin agents and skills (nextjs-expert 1.1.21)
- feat(php-expert): port Codex plugin agents and skills (php-expert 1.0.3)
- feat(prompt-engineer): port Codex plugin agents and skills (prompt-engineer 1.1.11)
- feat(react-expert): port Codex plugin agents and skills (react-expert 1.0.19)
- feat(rust-expert): port Codex plugin agents and skills (rust-expert 1.0.3)
- feat(security-expert): port Codex plugin agents and skills (security-expert 1.0.18)
- feat(seo): port Codex plugin agents and skills (seo 1.0.8)
- feat(shadcn-expert): port Codex plugin agents and skills (shadcn-expert 1.0.15)
- feat(solid): port Codex plugin agents and skills (solid 1.0.16)
- feat(swift-apple-expert): port Codex plugin agents and skills (swift-apple-expert 1.1.18)
- feat(tailwindcss): port Codex plugin agents and skills (tailwindcss 1.1.8)
- feat(tanstack-start-expert): port Codex plugin agents and skills (tanstack-start-expert 1.0.3)
- feat(typescript-expert): port Codex plugin agents and skills (typescript-expert 1.0.3)

### Fixed
- fix(agents): source agent TOMLs use portable skill paths; installer materializes `~/.codex/agents` with paths resolved from the currently installed plugin cache

All notable changes to the Fusengine Codex plugin ecosystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.27] - 2026-07-07

### Fixed
- fix(installer): drop the stale `$CODEX_HOME/bun.lock` before `bun install` — bun honors the lock over the regenerated manifest range, so setups kept serving the previous `@fusengine/harness` after a new release (proven live: 0.1.60 kept after 0.1.61 shipped); every setup now resolves fresh against the registry

## [1.2.26] - 2026-07-07

### Fixed
- fix(core-guards/ai-pilot): Codex sends `tool_input.command` as an array — 8 hooks read it as a string and crashed (TypeError, "PreToolUse hook failed") or mis-tracked; new shared `normalize-command.ts` helper, string behavior unchanged (core-guards 1.1.44, ai-pilot 1.2.35)
- fix(codex-rules/core-guards): the rules corpus and AGENTS.md are no longer echoed into the terminal at SessionStart (Codex always displays hook context, openai/codex#21696); the installer now merges the rules into `~/.codex/AGENTS.md` (fenced idempotent section, `project_doc_max_bytes=65536`), which Codex loads natively and silently (codex-rules 1.0.13)

## [1.2.25] - 2026-07-07

### Maintenance
- chore(deps): bump @clack/prompts 1.7.0, smol-toml 1.7.0, fast-xml-parser 5.9.3, lighthouse 13.4.0 (lockfile regenerated, 104 hook bundles rebuilt against the new versions)

## [1.2.24] - 2026-07-07

### Added
- feat(core-guards): shared guards converge on @fusengine/harness ^0.1.60 — one `hook codex core` call for Bash, harness gate on apply_patch; ask fail-open closed (deny), env-prefix bypass closed (PR #1)
- installer: self-healing root `bun install`, harness env toggles (RALPH_MODE, FUSE_* TTLs) persisted in `~/.codex/.env`, MCP key prompts scoped to selected MCPs (PR #2, #4)

### Fixed
- hook runtime shipped via local @fusengine/codex-hooks package installed into `~/.codex/node_modules` (git-clone installs had no dist → every native hook failed module-not-found); content-hashed tarball lives in CODEX_HOME, zero tmpdir (PR #2, #3)
- passing hooks are silent (Codex rejects bare permissionDecision:allow), per-prompt AGENTS.md/rules re-injection removed (exactly-once per session), stack/TS gating on validators, seo/validate-seo bundled (was raw-source, crashed exit 1 on cheerio) (PR #3, #5)

### Changed
- zero-python purge: orphaned cartographer wrappers and dead runtimeSharedOk chain removed; promptApiKeys fossil deleted — MCP flow owns key prompts (PR #4)

## [1.2.23] - 2026-06-03

### Fixed

- fix(core-guards 1.1.40): APEX research validation no longer false-blocks in Codex. The subagent-research recorder measured `String(tool_response).length`; since Codex delivers MCP results as content-block objects, `String()` produced `"[object Object]"` (length 15 < 50 threshold) → every real research call recorded `quality:"insufficient"`, leaving the cacheHit path as the only way to pass the Stop validator. Now uses the canonical `extractText()` helper to normalize content blocks before measuring (verified: 108 chars → sufficient). Threshold and cacheHit fallback unchanged.

## [1.2.22] - 2026-06-03

### Fixed

- fix(core-guards 1.1.39): close a critical inline-write bypass in bash-write-guard. The SAFE_PREFIXES short-circuit (env/npx/bunx/bun run/npm run/cp/mv, or any `;`/`&&` chaining after a safe prefix) ran before the interpreter inline-write check, so `env node -e ...` and `cp a b; node -e ...` slipped through. The check now runs first. Coverage widened (Bun.write, Deno.write*, appendFile(), writeSync(), fs.cp/truncate, outputFile, perl `open '>'`, osascript); dead NODE_WRITES/RUBY_WRITES exports removed; ai-pilot detect-bash-write (1.2.33) probe synced to the same set.

## [1.2.21] - 2026-06-03

### Changed

- feat(design-expert 2.1.25): migrate browser-automation MCP from playwright to fuse-browser (@fusengine/browser-mcp). Registered in design-expert + ai-pilot (1.2.32) .mcp.json and the installer catalog; hooks.json matchers + gating scripts now key on `mcp__fuse-browser__browser_navigate` / `browser_screenshot`, scroll detection uses native `browser_scroll`. Tool mapping: `browser_take_screenshot`→`browser_screenshot`, `browser_evaluate` scroll hack→`browser_scroll`, `browser_resize`→`browser_screenshot` viewports. Skills/rules/docs + seo (1.0.4) SERP updated; `@playwright/test` E2E references preserved.

### Fixed

- fix(core-guards 1.1.38): block interpreter inline file-writes that bypassed the gated apply_patch/Write/Edit tools. Agents escaped via `node <<'EOF' … writeFileSync … EOF`, `bun -e`, `python3 <<PY`, etc.; the guard only matched narrow `node -e`/`python -c` forms. Added INLINE_INTERPRETER + INLINE_WRITES probes and a DENY branch in bash-write-guard, mirrored in ai-pilot detect-bash-write. Read-only inline and script-file execution unaffected.

## [1.2.20] - 2026-06-01

### Changed

- Repo-wide Python to TS/Bun hook migration COMPLETE: all 14 remaining plugins' hooks (ai-pilot, cartographer, changelog-watcher, codex-rules, design-expert, laravel-expert, memory-neural, nextjs-expert, react-expert, security-expert, shadcn-expert, solid, swift-apple-expert, tailwindcss) are native TS bundles - no more Bun->python wrappers. Shared expert-skill libs consolidated to one canonical set in core-guards/_shared; validate.ts test suite is 100% bun test.

### Removed

- All Python purged (205 files): every _legacy_py tree, all python-spawning wrappers, and plugins/_shared/scripts/*.py. plugins/ is now ZERO-PYTHON - every hook runs native bundled TS.

## [1.2.19] - 2026-06-01

### Fixed

- `require-apex-agents` (core-guards 1.1.36, ai-pilot 1.2.30) now has a rollout ground-truth fallback (`apexAgentsInTranscript` in `ai-pilot/lib/apex/rollout-agents.ts`). It was state-only and depended on PostToolUse track-* hooks that fire unreliably in Codex code_mode (openai/codex#19385), so it false-blocked edits after the model had already explored/researched — and the model then tried to write its APEX state by hand (denied by bash-write-guard), a friction loop. The gate now detects explore (Glob/Grep/explore-bash/list_dir/explore-codebase) and research (Context7/Exa/WebSearch/WebFetch/research-expert) from the current turn's rollout, mirroring the fallbacks `require-solid-read` and `enforce-apex-phases` already had. Verified: rollout with evidence → allow (no state write needed); empty rollout → deny.

## [1.2.18] - 2026-06-01

### Removed

- `core-guards` 1.1.35 — final purge: `tests/test-sessions-pattern.ts` rewritten from a Bun→python wrapper into a real `bun test` (8/8), the redundant python invocation dropped from `scripts/validate.ts`, and the entire `_legacy_py` tree removed. `plugins/core-guards/scripts` now contains **zero Python files** — the Python→TS/Bun migration is 100% complete.

## [1.2.17] - 2026-06-01

### Changed

- `core-guards` 1.1.34 — Lot E: the 11 remaining wired Bun→python wrapper hooks (session-start ×3, session-end, subagent-start/stop, user-prompt ×2, instructions-loaded, teammate-idle, post enforce-file-size) are now native TS bundles. hooks.json is fully native (only `sound/play.ts`, a native Bun mp3 player, is a non-bundle entry).

### Removed

- Lot D purge: removed all dead Python wrapper hooks, the snake_case `_shared` stubs, dead non-hook wrappers (validate-setup, save-apex-state), and the dead `_legacy_py` hook tree (86 files, ~4.8k lines). Kept `_legacy_py/{tests,_shared}` (still used by `scripts/validate.ts`). The Python→TS/Bun hook migration is complete — every core-guards hook runs as a bundled native TS hook.

## [1.2.16] - 2026-06-01

### Changed

- `core-guards` 1.1.33 — Lot C of the Python→TS/Bun migration: the 6 direct-`python3` hooks (mcp-cache-lookup, limit-mcp-verbosity, webfetch-cache-lookup, webfetch-cache-store, cleanup-old-caches, validate-apex-workflow) are now native TS bundles. `hooks.json` has ZERO python3 references — every Lot A/B/C hook runs native. Webfetch cache key verified byte-identical across implementations (cross-impl store↔lookup round-trip HIT), so cache survives. Remaining: Lot D — purge `_legacy_py` + the few non-A/B/C wrappers (e.g. post-tool-use/enforce-file-size).

## [1.2.15] - 2026-06-01

### Changed

- `core-guards` 1.1.32 — Python→TS/Bun hook migration completed for Lot A (8 security/blocking guards: security, git, install, bash-write, enforce-interfaces, enforce-file-size, enforce-gemini-mcp, pre-commit) and Lot B (9 tracking post-hooks: track-agent-calls/solid-reads/subagent-research/session-changes, auto-document-reads, cache-mcp-result, log-tool-failure, post-edit-typescript, validate-task-solid). All run as bundled native TS via `hooks.json`; strict parity verified vs the Python (Lot A 104 cases incl. adversarial, Lot B decisions + session-state). `state-manager.ts` now honors `CODEX_HOME`. Python wrappers retained pending the purge phase. Remaining: Lot C (6 direct-python cache/cleanup hooks) + Lot D (purge `_legacy_py`).

## [1.2.14] - 2026-06-01

### Changed

- `require-solid-read` migrated from a Bun→python wrapper to native TS (`core-guards` 1.1.31): reuses the canonical ai-pilot ref-router and a new `solidRefRead`/`readPathsInTranscript` added to the shared `rollout-evidence` (`ai-pilot` 1.2.29). Keeps the unconditional SOLID-read policy and writes `state.target`; deny output preserved (routed ref list now from the single TS router — DRY, guardrail unchanged). Bundle runs via `hooks.json`.

## [1.2.13] - 2026-06-01

### Changed

- Install: `scripts/build-hooks.ts` now exports `buildPlugin` (CLI guarded by `import.meta.main`) and `installPluginCache` runs it per plugin before copying into the Codex cache, so `@hook-entry` bundles are regenerated at install. Bundled `dist/` is gitignored and untracked (no committed build artifacts). No plugin behaviour change.

## [1.2.12] - 2026-06-01

### Added

- Hook bundler `scripts/build-hooks.ts`: bundles any `@hook-entry`-marked hook source into a self-contained file (`Bun.build` target bun, `splitting:false`) so shared-lib imports are inlined for the isolated install layout. Foundation for the Python→TS/Bun hook migration.

### Changed

- `core-guards` 1.1.30: `require-apex-agents` ported from a Bun→python wrapper to native TS (`require-apex-agents.native.ts` + `_shared/apex-agents.ts`, reusing the TS `state-manager`); `hooks.json` runs the bundle. Parity verified byte-for-byte vs the Python across 5 cases including the 180-char `systemMessage` truncation. Guardrail behaviour unchanged.

## [1.2.11] - 2026-06-01

### Fixed

- APEX/SOLID gate (`core-guards` 1.1.29, `ai-pilot` 1.2.28): the gate proved compliance by scanning a fixed 512 KB rollout tail within a 120/180 s TTL — a noisy command (e.g. `rg` over rollouts) evicted the read/agent evidence out of the window, and the TTL expired during the very reads the gate demanded, producing an unwinnable re-deny loop. Evidence is now scoped to the current task turn: `tail_lines`/`readTail` slice from the last `user_message` (fallback `task_started` for subagent child rollouts) and match both compact (Codex/Rust) and spaced (Python) JSON. The wall-clock cutoff is dropped (turn boundary supersedes it), state-path TTLs raised to 1800 s, and two `break`→`continue` fixed in the stale-agent scan. Removed the dead `_within_ttl` helper and its `datetime` import.

## [1.2.10] - 2026-05-30

### Added

- Installer (`scripts/lib/install/config-prompt.ts`): new `agents.max_threads` prompt (6/8/12/16) to raise the concurrent sub-agent cap and avoid `agent thread limit reached`. New `toml-helpers.ts` module extracts `hasKey`/`setRootKey` (previously duplicated with `features.ts`) and adds table-scoped `setAgentsThreads`.

### Changed

- Installer `approval_policy` choices: dropped the deprecated `on-failure` value, added hints (`on-request` recommended — the model decides when to ask). README config table updated.

## [1.2.9] - 2026-05-29

### Added

- SEO plugin 2026 overhaul (seo 1.0.3): new seo-entity skill (entity/semantic SEO, Knowledge Graph, salience, schema about/sameAs/knowsAbout); local vs global intent (5 layers) with intent/CTA mapping; buyer-state long-tail (L1-L4) and citation eligibility; per-H2 answer capsules; conversion levers; quantified GEO impacts; AI-crawler allowlist in robots-default.

### Fixed

- SEO plugin (seo 1.0.3): wired the validate-seo PostToolUse hook (previously dead), corrected the Serper MCP tool name, repointed dead skill paths to real sibling skills, de-hardcoded localities to placeholders; sub-agents now consult their skill and seo-expert gained a script toolbox plus request routing.
- codex-rules (codex-rules 1.0.8): inject-rules now emits a dynamic hookEventName (SessionStart vs UserPromptSubmit) so per-prompt rule re-injection is no longer rejected, plus a non-dict stdin guard.
- Invalid model gpt-5.3-codex-spark replaced with gpt-5.4-mini (solid 1.0.11, ai-pilot 1.2.27); verified against the codex 0.135 binary model list.

### Changed

- AGENTS.md: dropped the redundant discovery meta line (Codex already embeds the AGENTS.md spec in its base instructions).

## [1.2.8] - 2026-05-28

### Fixed

- Codex check-skill gates (laravel/react/nextjs/swift/tailwind/shadcn/design) could block edits forever in code_mode: deny hints pointed at non-versioned skill folders absent from the cache, and skill-consultation evidence was read from state that per-tool hooks never write in code_mode (openai/codex#19385).
- `skill_paths.skill_md` resolves the cache version segment (semantic) so hints point at the real SKILL.md; `check_skill_common` falls back to the session rollout tree (main + child subagent rollouts) for base and specific skill consultation; `rollout_evidence` gains `skill_read`.
- `bash-write-guard` closes shell write evasions of the gated edit tools: the built-in patch shim, `git apply`, and in-place stream editors with combined flags (e.g. `perl -0pi`).
- Proven via real `codex exec`: laravel controller created, no infinite loop (15 → 5 transient blocks).

## [1.2.7] - 2026-05-28

### Fixed

- Codex code_mode "tourne en rond": per-tool Pre/PostToolUse hooks do not fire in code_mode (openai/codex#19385), so the APEX gates never saw the Context7/Exa consultation or SOLID reads done by subagents and blocked edits forever. Gates now fall back to the session rollout tree (main + child subagent rollouts, linked via session_id).
- `enforce-apex-phases` doc gate, `mcp_research` (all per-framework check-skill gates) and `require-solid-read` read evidence from the rollout when state is empty (ai-pilot 1.2.26, core-guards 1.1.28, suite 1.0.2).
- `bash-write-guard`: allow reads of APEX state/cache, block only mutations (fixes the "session state tampering" false-positive on `sed -n`/`cat` reads).
- Proven end-to-end via real `codex exec` runs (file created, no infinite loop).

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
