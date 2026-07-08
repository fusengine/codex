---
name: seo-cluster
description: "Use when building semantic keyword clusters from SERP overlap. Covers seed keyword expansion, Jaccard SERP overlap, intent grouping, pillar/cluster content architecture."
---


# Semantic Clustering

## Method

1. Take seed keyword (e.g. "codex code")
2. Fetch SERP for seed via Serper, fuse-browser (`browser_serp_batch`), or Exa (top 10 results)
3. For each related keyword (autocomplete + "People Also Ask"):
   - Fetch its SERP
   - Compute overlap with seed's SERP (Jaccard index)
4. Group keywords where SERP overlap ≥ 30% → same cluster
5. Cluster center = highest-volume keyword

## Output

```markdown
# Cluster: "codex code"

## Pillar: codex code (vol: 12K, KD: 45)
- Intent: informational
- Featured: AI Overview, video

## Cluster pages
1. codex code installation (vol: 2.4K)
2. codex code vs cursor (vol: 1.8K)
3. codex code mcp servers (vol: 900)
4. codex code hooks (vol: 720)
```

## Cluster by Buyer State (2026)

SERP overlap is the mechanical signal; the strategic axis is **buyer state + intent**, not surface similarity. Map each cluster keyword to a layer, then group by layer:

| Layer | State | Intent signal |
|-------|-------|---------------|
| **L1** | Awareness | "what is", "why", problem framing |
| **L2** | Comparison | "vs", "alternatives", "best for" |
| **L3** | Evaluation | "pricing", "reviews", "worth it" |
| **L4** | Decision | "buy", "near me", "demo", "signup" |

Two keywords with high SERP overlap but different buyer states belong to different pages. Never merge clusters on lexical similarity alone.

### Citation eligibility

AI Overviews capture ~30-60% of informational (L1/L2) CTR. For those layers, prioritize pages that produce verbatim-extractable answers per section over raw ranking — the goal is the LLM citation, not only the blue link.

## Local vs Global Intent (2026)

| Axis | LOCAL intent | GLOBAL intent |
|------|--------------|---------------|
| Type | Proximity transactional/navigational ("near me", "[service] [city]") | Informational / comparative |
| SERP feature | Triggers the Map Pack | AI Overviews-heavy |
| AI Overviews exposure | Resists (local results stay link-driven) | CTR eroded -40% to -58% on informational keywords |
| Target page | Local page / city hub | Global pillar |

**One intent = one URL.** Split a local page from the global/pillar page when local volume and content justify it. **Do not split** if local volume is below ~30 searches/month, or if you cannot write 1200+ words that are genuinely distinct from the pillar.

Anti-cannibalization (local/global): the primary keyword is exclusive per page — pillar = `[service]` (no city), local = `[service] [city]`. Two pages must never share the same primary query.

## Anti-Cannibalization Check

Before creating cluster pages, verify no existing page targets the same buyer state + intent. Use `seo-content` skill.

See `seo-internal-linking` for the pillar/local/region URL architecture and link mesh.
