# Visual and design profile

Use this profile for pixels: responsive layouts, light/dark rendering, multi-route capture, and regression comparison.

| Need | Tool |
|------|------|
| Responsive and color-scheme capture | `browser_screenshot` with batched viewports |
| Several URLs | `browser_shots_batch` |
| A site-wide capture | `browser_site_shots` |
| Baseline comparison | `browser_visual_diff` |

Prefer one batched capture over per-viewport or per-URL loops. This profile covers raw capture and comparison only. Route full identity, generation, motion, and design-audit work through the relevant `design-expert` skills.

## Examples

```text
browser_screenshot {
  sessionId: "<session-id>",
  viewports: ["mobile", "tablet", "desktop"],
  colorScheme: "dark"
}

browser_shots_batch {
  urls: ["http://localhost:4321/", "http://localhost:4321/pricing"]
}

browser_visual_diff { baseline: "home-v1.png", sessionId: "<session-id>" }
```

Open and navigate the session before `browser_screenshot` or session-based `browser_visual_diff`, then close it on every exit path. For two existing PNGs, call `browser_visual_diff` with `a` and `b`. Use `design-expert:design-web` for generation and `design-expert:design-review` for the deterministic final gate. Do not reproduce that pipeline here.
