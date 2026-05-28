---
name: seo-page
description: "Use when analyzing a single page via /seo page. Covers meta extraction, schema validation, header hierarchy, content quality, and GEO readiness for one URL or local file."
---


# Single-Page SEO Analysis

## Workflow

1. Fetch page (URL via WebFetch, or read local file)
2. Run `scripts/parse-meta.ts <input>` → extract title, description, OG, Twitter, canonical
3. Run `scripts/validate-schema.ts <input>` → JSON-LD validation
4. Analyze H1-H6 hierarchy
5. Run `scripts/geo-score.ts <input>` → LLM-readiness score
6. Output structured report

## Checks

| Element | Rule |
|---------|------|
| `<title>` | 50-60 chars, primary keyword, brand |
| `<meta description>` | 120-155 chars, hook + benefit + CTA |
| `<h1>` | Exactly one, contains primary keyword |
| `<h2>-<h6>` | Hierarchical, no skip |
| Canonical | Self-referencing or pointing to authoritative URL |
| Open Graph | og:title, og:description, og:image (1200x630), og:url |
| Twitter Cards | summary_large_image with og:image |
| Schema | At least one JSON-LD block, validates against schema.org |
| Images | All have alt, lazy-loaded, WebP/AVIF |

## Related Skills

- `seo-schema` — JSON-LD detect/validate/generate
- `seo-images` — alt text, formats, lazy loading
- `seo-featured-snippets` — position 0 / AI Overviews structure
- `seo-geo` — LLM-readiness scoring
