---
name: seo-content-brief
description: "Use when generating detailed SEO content briefs. Covers target keywords, search intent, outline (H2/H3), word count, internal links, schema requirements, GEO readiness checklist."
---


# Content Brief Generator

## Content Intelligence First

Before generating a brief, run `scripts/analyze-keywords.ts` when available. Use the result to shape target keywords, semantic variants, heading coverage, local modifiers, and cannibalization warnings.

```bash
bun run scripts/analyze-keywords.ts <url-or-path> --keyword "<primary keyword>" --format markdown
bun run scripts/track-rank.ts "<query>" <domain-or-url> --gl ch --hl fr --location "<city, region, country>" --pages 3 --format markdown
bun run scripts/cannibalization-audit.ts "<primary keyword>" <domain> --target-url <url> --gl ch --hl fr --location "<city, region, country>" --pages 3 --format markdown
```

Use Serper-backed rank checks before the brief when ranking context matters: confirm the target site's real Google position, list competitor URLs above it, and separate competitor pressure from same-domain cannibalization.

## Metadata and Heading Rules

- Meta title must be 60 characters or less.
- Meta description must be 150 characters or less.
- Do not include the company or brand name in the meta title unless the client explicitly asks. If useful, provide a branded variant as an option or exception.
- Meta title and H1 should be semantically similar, but not necessarily identical.
- Meta title and H1 need the primary keyword or a strong variant.
- H2/H3 headings should distribute synonyms, long-tail phrases, questions, and sub-intents.
- Avoid repeating the exact keyword across every heading.
- Localities such as Vevey, La Tour-de-Peilz, Montreux, Chexbres, Corsier-sur-Vevey, and Clarens must appear naturally near service terms, not as city-list dumps.
- Keyword stuffing requires multiple signals: exact repetition, repeated n-grams, local repetition, weak semantic diversity, thin content, and unnatural placement. Do not use a fixed density threshold alone.

## Brief Structure

```markdown
# Content Brief: <topic>

## Target Keywords
- Primary: <kw> (vol, KD, intent)
- Secondary: <kw1>, <kw2>, <kw3>
- Long-tail: <lt1>, <lt2>, <lt3>

## Search Intent
- Type: informational | navigational | commercial | transactional
- User question: "<exact question>"
- Expected format: guide | listicle | comparison | tutorial

## Outline
- Meta title: <primary keyword or strong variant, <=60 chars, no brand unless requested>
- Meta description: <benefit + intent match, <=150 chars>
- H1: <semantic match to title, primary keyword or strong variant>
- H2: <synonym, long-tail phrase, question, or sub-intent>
  - H3: <supporting sub-intent>
- H2: <section 2>
- H2: FAQ
- H2: Conclusion

## Quick Answer (first 100 words)
<concise answer for AI Overviews / featured snippet>

## Word Count Target
<based on top 10 SERP average>

## Internal Links (5-10)
- → <pillar page>
- → <related cluster pages>

## Schema
- Article + BreadcrumbList (always)
- FAQPage (if FAQ section)
- VideoObject (if video embed)

## GEO Requirements
- Quick answer paragraph in first 100 words
- Cite 3-5 authoritative sources
- Use tables/lists for comparison data
- Include statistics with dates and sources
```

## References

- `skills/seo/04-geo-2026/content-structure.md`
- `skills/seo/06-content-strategy/keyword-research.md`
