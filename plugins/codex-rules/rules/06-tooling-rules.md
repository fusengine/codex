## MCP Servers

| Server | Usage | Agent |
|--------|-------|-------|
| **Context7** | Documentation | `research-expert` |
| **Exa** | Web search | `research-expert`, `websearch` |
| **Magic** | UI generation | `design-expert` |
| **shadcn** | Component registry | `design-expert`, `shadcn-ui-expert` |
| **Gemini Design** | AI frontend | `design-expert` |

## Skills Location
Use `${PLUGIN_ROOT}/skills/` inside hooks and plugin scripts. Installed plugins
are cached under `~/.codex/plugins/cache/fusengine-codex/<plugin>/<version>/`.
SOLID refs live under each plugin's `skills/solid-*/references/` when present.

## Documentation
ALL docs in `docs/` folder - NEVER outside except root `README.md`

## Git & GitHub Flow (ZERO TOLERANCE)

**Commit tool**: prefer the Fusengine commit workflow when available. NEVER
`git commit` directly unless the user explicitly requests that exact command.

**Branch enforcement**:
- `main`, `master`, `develop`, `production` → **protected**, no direct commits
- All work on feature branches: `<type>/<scope>` (e.g. `feat/seo`, `fix/sniper-loop`, `chore/deps`)
- Types: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `perf/`, `test/`, `ci/`, `build/`, `style/`
- kebab-case, < 50 chars, no personal prefix

**Workflow** (handled by the commit plugin when available):
1. Step 0: branch check — block if on protected, propose feature branch
2. Step 1: security scan (secrets, .env)
3. Steps 2-5: conventional commit with auto-detection
4. Step 6: post-commit (CHANGELOG + version bump + tag)
5. Step 7: push branch + propose `gh pr create`

**Merge strategy**: squash via `gh pr merge --squash --delete-branch`. Keep branches < 3 days.

Skill reference: `fuse-commit-pro:git-flow`.

## Codex Hooks

Use stable lifecycle events only: `SessionStart`, `UserPromptSubmit`,
`PreToolUse`, `PostToolUse`, `PermissionRequest`, and `Stop`. Do not register
`PreCompact` for plugin hooks until Codex stabilizes it.

Plugin-bundled hooks require:

```toml
[features]
hooks = true
plugin_hooks = true
```

Use `PLUGIN_ROOT` and `PLUGIN_DATA` in hook scripts. Legacy Claude env vars are
allowed only in migration compatibility code.
