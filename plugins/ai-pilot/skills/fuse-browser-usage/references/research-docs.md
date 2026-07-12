# Research and documentation profile

Use this profile when the result is text, HTML, structured data, documentation, or search results. Do not open a live browser merely to read.

| Need | Tool |
|------|------|
| One known page | `browser_fetch` |
| Several known pages | `browser_fetch_batch` |
| A bounded site section | `browser_crawl` |
| Search-result discovery | `browser_serp_batch` (managed batch session) |

Batch URLs and queries in one call. Bound crawls by page count and depth. For repeated cards or tables, use deterministic schema extraction with a container selector instead of manual snapshot parsing.

For drift-prone APIs or versions, use this profile after official documentation/Context7 and code-context research when another source is needed. A single uncertain source is not sufficient evidence.

## Examples

```text
browser_fetch { url: "https://example.com/docs/api" }
browser_fetch_batch { urls: ["https://example.com/docs/install", "https://example.com/docs/config"] }
browser_crawl { url: "https://example.com/docs/", maxPages: 40, maxDepth: 3 }
browser_serp_batch { queries: ["astro 6 content layer", "astro server islands"] }
```

Do not create a caller-managed session with `browser_open` for these tasks. `browser_serp_batch` manages its own search session. If application interaction or JavaScript-rendered state is required, switch to the web-application profile.
