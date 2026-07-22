## MCP Servers

| Server | Usage | Agent |
|--------|-------|-------|
| **Context7** | Documentation | `research-expert` |
| **Exa** | Web search/code context | `research-expert`, `websearch` |
| **Magic** | UI generation | `design-expert` |
| **shadcn** | Component registry | `design-expert`, `shadcn-ui-expert` |
| **Gemini Design** | AI frontend | `design-expert` |
| **fuse-browser** | Browser automation, scraping, SERP, visual diff, CWV | `seo`, `security-expert`, `design-expert`, frontend experts, `changelog-watcher`, `research-expert`, `websearch`, `sniper` |

## Skills Location
Plugin skills paths are injected at SessionStart. Use paths from context or `${PLUGIN_ROOT}/skills/`; never hardcode marketplace versions.
SOLID refs live under each plugin's `skills/solid-*/references/` when present.

## Documentation
ALL docs in `docs/` folder - NEVER outside except root `README.md`.
