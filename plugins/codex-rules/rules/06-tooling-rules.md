## MCP Servers
Context7 -> docs (`research-expert`) · Exa -> web/code search (`research-expert`,`websearch`) · Magic -> UI gen (`design-expert`) · shadcn -> component registry (`design-expert`,`shadcn-ui-expert`) · Gemini Design -> AI frontend (`design-expert`) · fuse-browser -> automation/scraping/SERP/visual-diff/CWV (`seo`,`security-expert`,`design-expert`, frontend experts, `changelog-watcher`, `research-expert`, `websearch`, `sniper`).
fuse-browser validation: screenshots/visual_diff/metrics/console/network/cookies.
Skills: paths injected at SessionStart, use context or `${PLUGIN_ROOT}/skills/` (never hardcode versions); SOLID refs under each plugin's `skills/solid-*/references/`.
Docs: ALL in `docs/` folder — never outside except root `README.md`.
