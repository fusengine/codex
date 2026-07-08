## MCP Servers

| Server | Usage | Agent |
|--------|-------|-------|
| **Context7** | Documentation | `research-expert` |
| **Exa** | Web search/code context | `research-expert`, `websearch` |
| **Magic** | UI generation | `design-expert` |
| **shadcn** | Component registry | `design-expert`, `shadcn-ui-expert` |
| **Gemini Design** | AI frontend | `design-expert` |
| **fuse-browser** | Browser automation, scraping, SERP, visual diff, CWV | `seo`, `security-expert`, `design-expert`, frontend experts, `changelog-watcher`, `research-expert`, `websearch`, `sniper` |

**Verification chain (any uncertain API/version/config - ZERO TOLERANCE):** Context7/official docs -> Exa/code context -> fuse-browser fast-path (`browser_fetch` on known doc URLs, `browser_serp_batch` for discovery). One source is NEVER enough for an uncertain API.

## fuse-browser - Efficient Usage (ZERO TOLERANCE)

1. **Fast-path FIRST** - use `browser_fetch`, `browser_fetch_batch`, `browser_crawl`, `browser_serp_batch` to read pages, bulk-fetch, crawl a site, or scrape SERP. Open a live session ONLY when interaction, JS rendering, auth, pixels, console/network, or metrics are needed.
2. **One session, always closed** - `browser_open` once, reuse the `sessionId`, then `browser_close` when done.
3. **Batch over loops** - batch SERP, fetch, screenshots, viewports, and color schemes when practical.
4. **Deterministic extraction** - structured extraction over manual snapshot parsing.
5. **Validation tools** - screenshots, visual diff, metrics, console, network, and cookies for runtime/security checks.

## Skills Location
Plugin skills paths are injected at SessionStart. Use paths from context or `${PLUGIN_ROOT}/skills/`; never hardcode marketplace versions.
SOLID refs live under each plugin's `skills/solid-*/references/` when present.

## Documentation
ALL docs in `docs/` folder - NEVER outside except root `README.md`.

## Git & GitHub Flow (ZERO TOLERANCE)

**Commit tool**: prefer Fusengine `commit-pro` workflow when available. NEVER use `git commit` directly unless the user explicitly asks for that exact command or the workflow is unavailable and the user asked to commit.

**Branch enforcement**:
- `main`, `master`, `develop`, `production` -> **protected**, no direct commits.
- All work on feature branches: `<type>/<scope>` (e.g. `feat/seo`, `fix/sniper-loop`, `chore/deps`) only when branch creation is explicitly allowed.
- Types: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `perf/`, `test/`, `ci/`, `build/`, `style/`.
- kebab-case, < 50 chars, no personal prefix.

**Workflow** (handled by commit-pro when available):
1. Step 0: branch check - block if on protected, propose feature branch.
2. Step 1: security scan (secrets, `.env`).
3. Steps 2-5: conventional commit with auto-detection.
4. Step 6: post-commit (CHANGELOG + version bump when workflow requires it).
5. Step 7: push branch + PR only when asked.

**Merge strategy**: squash via `gh pr merge --squash --delete-branch`. Keep branches < 3 days.

Skill reference: `commit-pro:git-flow`.

On Codex: `git commit`, `git add`, `git checkout -b`, and project installs (`bun install`, `npm install`, etc.) may be blocked by `@fusengine/harness` unless `RALPH_MODE=1` is set. Ralph mode exempts only the safe git set and project installs. System installs and destructive git are never exempt.

## Codex Hooks

Official Codex hook events include `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Stop`, `PreCompact`, `PostCompact`, `SubagentStart`, and `SubagentStop`.

Hooks are enabled by default. To disable them, set `[features].hooks = false`.
Use `hooks` as the canonical feature key; `codex_hooks` is deprecated.

Plugin-bundled hooks live at `hooks/hooks.json` by default or the manifest `hooks` path. Use `PLUGIN_ROOT`, `PLUGIN_DATA`, `CODEX_HOME`, and Codex hook payload fields in hook scripts. Legacy Claude env vars are allowed only in migration compatibility code.
