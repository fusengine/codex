---
name: seo-content
description: "Use when analyzing content quality. Covers E-E-A-T scoring (Experience, Expertise, Authoritativeness, Trustworthiness), anti-cannibalization, keyword distribution, AI content disclosure, search intent matching."
---


# Content Quality (E-E-A-T 2026)

## Content Intelligence Workflow

Before content recommendations, run `scripts/analyze-keywords.ts` when available. Use it as the first-pass evidence for keyword distribution, semantic breadth, local modifier placement, heading coverage, and cannibalization risk.

```bash
bun run scripts/analyze-keywords.ts <url-or-path> --keyword "<primary keyword>" --format markdown
bun run scripts/track-rank.ts "<query>" <domain-or-url> --gl ch --hl fr --location "<city, region, country>" --pages 3 --format markdown
bun run scripts/cannibalization-audit.ts "<primary keyword>" <domain> --target-url <url> --gl ch --hl fr --location "<city, region, country>" --pages 3 --format markdown
```

Use Serper-backed rank checks to confirm the target site's real Google position, list competitor URLs above it, and decide whether the content gap comes from competitors or same-domain cannibalization.

## E-E-A-T Pillars

- **Experience**: First-hand knowledge signals (case studies, photos, "I tried...")
- **Expertise**: Author credentials, depth, technical accuracy
- **Authoritativeness**: Industry recognition, citations, backlinks
- **Trustworthiness**: Contact info, HTTPS, transparent ownership, fact-checking

## Anti-Cannibalization

- One primary keyword per URL
- Different search intents per page (info / navigational / transactional)
- Internal linking respects pillar/cluster topology

## Metadata and Heading Rules

- Meta title must be 60 characters or less.
- Meta description must be 150 characters or less.
- Do not include the company or brand name in the meta title unless the client explicitly asks. If needed, present a branded title as an option or exception.
- Meta title and H1 should be semantically similar, but not necessarily identical.
- Meta title and H1 need the primary keyword or a strong variant.
- H2/H3 headings distribute synonyms, long-tail phrases, questions, and sub-intents.
- Avoid repeating the exact keyword across every heading.

## Local Semantic Distribution

- Place localities naturally near service terms, for example Vevey, La Tour-de-Peilz, Montreux, Chexbres, Corsier-sur-Vevey, Clarens, and nearby market terms.
- Do not dump cities as standalone lists.
- Prefer sentence-level relevance such as service + locality + proof or context.

## Keyword Stuffing Detection

Do not use a fixed `>3%` density threshold as the stuffing rule. Flag keyword stuffing only when multiple signals align:

- Exact keyword repetition
- Repeated n-grams
- Repeated local modifiers
- Low semantic diversity
- Thin content
- Unnatural heading, anchor, or paragraph placement

## AI Content Guidelines

- Disclose AI-assisted content where required
- Human review + first-hand experience injected
- Avoid generic AI-typical structures ("In conclusion...", "It's important to note...")

## References

- `skills/seo/06-content-strategy/` (eeat-implementation, anti-cannibalization, ai-content-guidelines, keyword-research, keyword-distribution)
