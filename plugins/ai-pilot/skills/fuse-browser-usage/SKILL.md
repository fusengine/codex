---
name: fuse-browser-usage
description: "Route efficient fuse-browser usage across fetch, crawl, SERP, live sessions, screenshots, webapp testing, console/network inspection, and visual diffs. Use when any fuse-browser tool may be called. Do NOT use for ordinary local-file inspection or when no browser/web evidence is needed."
---

# fuse-browser — Efficient Usage

Canonical routing for every `mcp__fuse-browser__*` call. Read this file first, then load only the reference matching the task.

## Four rules

1. **Choose the lightest path** — use the HTTP fast-path (`browser_fetch`, `browser_fetch_batch`, `browser_crawl`) for known pages and structured text. Use `browser_serp_batch` for managed batch search; it manages its own session. Open a caller-managed live session only for interaction, JavaScript rendering, authentication state, console/network inspection, or pixels.
2. **One session, always closed** — call `browser_open` once, reuse the returned `sessionId`, and call `browser_close` on every exit path.
3. **Batch over loops** — batch queries, URLs, screenshots, viewports, and color schemes whenever the tool supports it.
4. **Deterministic extraction** — prefer schema/container extraction over manually parsing snapshots.

## Route to one reference

| Goal | Reference |
|------|-----------|
| Read docs, bulk-fetch, crawl, or discover URLs | `references/research-docs.md` |
| Test a running web application | `references/webapp-testing.md` |
| Capture responsive/dark screenshots or compare visuals | `references/visual-design.md` |

Validation tools such as `browser_visual_diff`, `browser_console`, `browser_network`, and `browser_cookies` complement the selected profile. `browser_metrics` reports process-global scraper health; it is not a page-performance or Core Web Vitals measurement. For a complete design workflow, use the relevant design skill; this skill owns browser-tool discipline only.

Never open a live session only to read text or HTML. The session TTL is a safety net, not a substitute for `browser_close`.
