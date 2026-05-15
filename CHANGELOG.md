# Changelog

All notable changes to the Fusengine Codex plugin ecosystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
