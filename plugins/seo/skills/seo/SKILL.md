---
name: seo
description: "Use when running SEO, GEO, schema, Core Web Vitals, sitemap, hreflang, E-E-A-T, AI Overviews, technical SEO, or structured data tasks. Covers full-site audits, single-page analysis, schema markup, content quality, AI search optimization, local SEO, sitemap/robots, internal linking, semantic clustering, and search experience."
---


# SEO/GEO Orchestrator

**Invocation:** `/seo $1 $2` where `$1` is the command and `$2` is the URL or local path.

Comprehensive SEO + GEO 2026 analysis across all industries (SaaS, local services, e-commerce, publishers, agencies). Orchestrates 21 sub-skills and 8 parallel sub-agents. Local-first core; Serper optional for live SERP/positions.

## Quick Reference

| Command | What it does | Sub-skill |
|---------|--------------|-----------|
| `/seo audit <url>` | Full audit with parallel subagent delegation | seo-audit |
| `/seo page <url\|path>` | Deep single-page analysis | seo-page |
| `/seo technical <url>` | Technical SEO (robots, CWV, crawlability) | seo-technical |
| `/seo schema <url\|path>` | Detect/validate/generate JSON-LD | seo-schema |
| `/seo content <url>` | E-E-A-T + anti-cannibalization | seo-content |
| `/seo images <url>` | Image SEO: alt text, formats, lazy loading | seo-images |
| `/seo sitemap <url\|generate>` | Analyze or generate XML sitemaps | seo-sitemap |
| `/seo hreflang <url>` | i18n/multilingual audit and generation | seo-hreflang |
| `/seo internal-linking <url>` | Pillar/cluster, anchor optimization | seo-internal-linking |
| `/seo cluster <keyword>` | SERP-based semantic clustering | seo-cluster |
| `/seo brief <topic>` | Generate detailed content brief | seo-content-brief |
| `/seo plan <type>` | Strategic planning (saas/local/ecommerce/publisher) | seo-plan |
| `/seo sxo <url>` | Search Experience Optimization | seo-sxo |
| `/seo snippets <url>` | Position 0 + AI Overviews input | seo-featured-snippets |
| `/seo local <url>` | Local SEO (GBP, NAP, citations, map pack) | seo-local |
| `/seo geo <url>` | AI Overviews/ChatGPT/Perplexity/Codex readiness | seo-geo |
| `/seo ecommerce <url>` | Product schema, faceted nav, marketplace | seo-ecommerce |
| `/seo video <url>` | VideoObject, YouTube, transcripts | seo-video |
| `/seo redirects <url>` | 301/302, migration, chains | seo-redirects |
| `/seo drift <url>` | SEO diff vs previous git HEAD | (uses diff-seo.ts) |

## Orchestration Logic — `/seo audit`

When user invokes `/seo audit <url>`:
1. Detect business type from homepage (SaaS, local, ecommerce, publisher, agency)
2. Spawn sub-agents **in parallel** (single message, multiple Agent calls):
   - `seo-technical` (robots, sitemap, CWV, hreflang)
   - `seo-schema` (JSON-LD detect/validate)
   - `seo-content` (E-E-A-T, anti-cannibalization)
   - `seo-geo` (AI Overviews readiness)
   - `seo-images` (alt, formats, optim)
   - `seo-sitemap` (sitemap.xml + robots.txt)
3. **If local business detected** → also spawn `seo-local`
4. **If content strategy signals** (blog, pillar pages) → also spawn `seo-cluster`
5. Collect results, generate unified report with **SEO Health Score (0-100)**
6. Create prioritized action plan (Critical → High → Medium → Low)

## Workflow (7 phases — for content-creation flows)

```
PHASE 1: ANALYZE   → Extract content, detect intent
PHASE 2: RESEARCH  → SERP analysis, 2026 trends, AI platforms
PHASE 3: KEYWORDS  → Run Content Intelligence scripts when available, then extract with anti-cannibalization
PHASE 4: STRUCTURE → Meta, OG, Twitter Cards, Hn, schema, alt
PHASE 5: CONTENT   → Write SEO+GEO optimized content
PHASE 6: VALIDATE  → SEO + GEO compliance checklists
PHASE 7: DRIFT     → Compare to git HEAD (diff-seo.ts)
```

## Content Intelligence Rules

Run `scripts/analyze-keywords.ts` before content recommendations when it is available in the active repo or installed SEO plugin. Use its output before manual recommendations for keyword coverage, semantic distribution, local modifiers, and cannibalization risk.

- Meta title must be 60 characters or less.
- Meta description must be 150 characters or less.
- Do not include the company or brand name in the meta title unless the client explicitly asks. If branding is useful, present it as an optional or exception variant.
- Meta title and H1 should be semantically similar, but they do not need to be identical.
- Meta title and H1 need the primary keyword or a strong variant.
- H2/H3 headings should distribute synonyms, long-tail phrases, questions, and sub-intents.
- Avoid repeating the exact keyword across every heading.
- The client's target localities (primary [city] + neighbouring municipalities/[region]) must appear naturally near service terms, never as a dumped city list.
- Keyword stuffing must be diagnosed from multiple signals: exact repetition, repeated n-grams, local modifier repetition, weak semantic diversity, thin content, and unnatural placement. Do not use a fixed density threshold alone.

## Sub-Skills (21 — one folder per skill)

Each capability is a sibling skill under `plugins/seo/skills/`. Invoke the matching skill directly; there is no shared `references/NN-*/` tree.

```
seo                  → this orchestrator
seo-audit            → full-site audit, parallel sub-agents, Health Score
seo-page             → single-page deep analysis
seo-technical        → robots, CWV, crawlability, mobile-first
seo-schema           → JSON-LD detect/validate/generate
seo-content          → E-E-A-T, anti-cannibalization, answer capsules
seo-content-brief    → content brief + buyer-state long-tail layering
seo-cluster          → SERP-overlap + buyer-state clustering
seo-internal-linking → pillar/cluster, anchors, orphan/depth audit
seo-featured-snippets→ position 0 + AI Overviews input
seo-sxo              → search experience optimization
seo-geo              → AI Overviews / ChatGPT / Perplexity / Codex readiness
seo-entity           → entity-based SEO, knowledge graph, sameAs, semantic depth
seo-plan             → strategic roadmaps by business type
seo-ecommerce        → product schema, faceted nav, marketplace
seo-local            → GBP, NAP, citations, Local Pack
seo-images           → alt text, formats, lazy loading
seo-video            → VideoObject, transcripts
seo-sitemap          → sitemap.xml / robots.txt
seo-hreflang         → i18n / multilingual
seo-redirects        → 301/302, migration, chains
```

## Scripts Available (`scripts/`)

| Script | Purpose |
|--------|---------|
| `parse-meta.ts` | Extract title/description/OG/canonical via cheerio |
| `validate-schema.ts` | Validate JSON-LD offline against schema.org dumps |
| `check-cwv.ts` | Lighthouse CLI local wrapper |
| `parse-sitemap.ts` | Validate sitemap.xml structure |
| `parse-robots.ts` | Validate robots.txt directives |
| `parse-hreflang.ts` | Validate hreflang tags |
| `diff-seo.ts` | SEO drift via `git diff` |
| `geo-score.ts` | LLM-readiness scoring (0-100) |
| `analyze-keywords.ts` | Content Intelligence keyword, semantic, local modifier, and stuffing signal analysis |
| `track-rank.ts` | Live rank tracking for a query/domain/location, including competitor URLs above the target |
| `cannibalization-audit.ts` | Detect competing same-domain URLs targeting the same keyword or intent |

### Content Intelligence Commands

Run from the SEO plugin root when the scripts are available:

```bash
bun run scripts/analyze-keywords.ts <url-or-path> --keyword "<primary keyword>" --format markdown
bun run scripts/track-rank.ts "<query>" <domain-or-url> --gl ch --hl fr --location "<city, region, country>" --pages 3 --format markdown
bun run scripts/cannibalization-audit.ts "<primary keyword>" <domain> --target-url <url> --gl ch --hl fr --location "<city, region, country>" --pages 3 --format markdown
```

Use Serper-backed commands to check the target site's real Google position, identify competitor pages above it, and verify whether ranking loss comes from competitors or same-domain cannibalization.

## Differentiation

- **Local-first core**: offline checks by default; Serper is used for live Google position checks, competitor positions, and cannibalization evidence
- **Framework-native**: delegates implementation to `fuse-astro`, `fuse-nextjs`, `fuse-laravel`
- **GEO-first**: AI Overviews/ChatGPT/Perplexity as primary target, not afterthought
- **TS/Bun stack**: all scripts in TypeScript, executed by Bun

## Industry Detection

Detect from homepage signals:
- **SaaS**: `/pricing`, `/features`, `/integrations`, "free trial", "sign up"
- **Local**: address, phone, opening hours, GBP link, NAP
- **E-commerce**: `/products`, `/cart`, `/checkout`, product schema
- **Publisher**: `/articles`, `NewsArticle` schema, byline, dateline
- **Agency**: `/services`, `/case-studies`, `/clients`, testimonials

## Quality Gates

- **30+ location pages** → warning
- **50+ location pages** → hard stop, require manual audit
- **100+ programmatic pages** → warning
- **500+ programmatic pages** → hard stop
- **Thin content** detection per page type
- **Doorway page** prevention

## First Invocation — Activate Hook

When user invokes `/seo` for the first time on a project:

1. Check if `.fuse-seo` marker exists at project root (or any parent up to repo root)
2. If **absent**, ask the user **before any other work**:
   > "Activate the fuse-seo hook on this project? It will validate meta/schema/OG on every Write/Edit of HTML-like files (`.html`, `.astro`, `.tsx`, `.vue`, `.blade.php`) via `hooks/validate-seo.ts`."
3. If user confirms → create empty file `.fuse-seo` at project root via `touch .fuse-seo` (or Write tool with empty content)
4. If user declines → proceed without creating the marker (hook stays dormant on this project)
5. **Do not ask again** in the same session — the marker presence is the persistent answer

This is opt-in by design: never auto-create without explicit user consent.

## After Any Analysis

1. Generate markdown report in `.fuse-seo/reports/<date>-<command>.md`
2. Offer drift baseline capture: `/seo drift <url>` for future comparisons
3. Suggest framework-specific implementation via delegation:
   - Astro project → `fuse-astro:astro-seo`
   - Next.js → `fuse-nextjs:nextjs-stack`
   - Laravel → `fuse-laravel:laravel-blade`
