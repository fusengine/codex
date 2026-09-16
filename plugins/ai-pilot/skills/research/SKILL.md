---
name: research
description: Use when researching documentation, best practices, or complex technical investigations -- Context7 + Exa + Sequential Thinking methodology.
---

<objective>
Research is the technical-research methodology behind the `research-expert` agent. It starts with the fuse-browser fast path, checks official versioned documentation through Context7, then uses Exa for independent confirmation. It records source date, capture time, version, and applicability instead of treating retrieval as proof.

It runs in a forked, read-only context through `research-expert` and follows the canonical mandate and Exit contract in `lead-orchestration`.
</objective>

**Session:** ${CLAUDE_SESSION_ID}

**Research Topic:** $ARGUMENTS

# Research Skill

## Required Inputs

Research question; target product/library and version range; relevant environment; decision to support; and the current mandate's capture date. Unknown inputs remain explicit unresolved facts.

## Research Workflows

### Standard Query
```
1. SCOPE → Decompose the exact claim and required proof
2. FAST PATH → Fetch known official URLs or discover them with fuse-browser
3. RESOLVE → Context7 resolve-library-id
4. DOCUMENT → Context7 official, versioned docs
5. CONFIRM → Exa code context or web search
6. APPLY → Check version, date, environment, and decision applicability
7. SYNTHESIZE → Findings, contradictions, unresolved facts, and one Exit status
```

### Complex Investigation
```
1. DEEP THINK → Multi-hypothesis structured analysis
2. DISCOVER → fuse-browser fast-path official sources
3. VALIDATE → Context7 official, versioned sources
4. DEEP RESEARCH → Exa deep researcher when the evidence gap justifies it
5. CONTRADICT → Test claims across sources and environments
6. REPORT → Applicable evidence, unresolved conflicts, and one Exit status
```

### Technology Trends
```
1. WEB SCAN → fuse-browser dated official/news discovery
2. OFFICIAL BASELINE → Context7 versioned documentation
3. CODE PATTERNS → Exa code context for current practices
4. ANALYSIS → Freshness and applicability check
5. RECOMMENDATIONS → Sourced actions plus unresolved risks
```

---

## Multi-Source Synthesis

**Sequence**:
- Fuse-browser fast path first: known official URL fetch, or SERP discovery when unknown
- Context7 official docs second: resolve the library ID before querying
- Exa third: independently confirm the material claim
- Batch independent URLs or queries within each stage

**Source Priority**:
1. Official source reached through fuse-browser and dated at capture
2. Official versioned documentation from Context7
3. Independent Exa code/ecosystem evidence
4. Older material only when version and applicability are proven

## Evidence Stop Criteria

Stop with `Exit: Stop` only when every material claim has current, version-compatible, applicable evidence and contradictions are resolved or listed. Never use a tool-call count, cache hit, or repeated result as a proxy for proof. If a source or fact remains unavailable, return `Retry`, `Ask`, or `Escalate` with attempts, missing evidence, and the next responsible check.

Prior or cached research may guide query formulation, but it is never evidence for the current mandate. Consult the fuse-browser → Context7 → Exa chain afresh and cite the newly obtained results. If a required source is unavailable, report the missing consultation and lower confidence instead of substituting cached findings.

---

## Forbidden Behaviors

- ❌ Guess library IDs without `resolve-library-id`
- ❌ Start deep researcher without checking completion
- ❌ Mix opinions with facts without distinction
- ❌ Provide code without version verification
- ❌ Ignore WebFetch redirects
- ❌ Recommend without citing sources
- ❌ Skip Sequential Thinking for multi-step problems
- ❌ Treat retrieval, source count, cache presence, or repetition as proof
- ❌ Substitute prior or cached research for fresh documentation consultation in the current mandate
- ❌ Omit source date, capture time, version, applicability, contradictions, or unresolved facts

---

## Detailed References (Load on Demand)

- `references/tool-usage.md` — Load when calling Context7, Exa, or Sequential Thinking (exact call patterns, models, and per-tool error handling)
- `references/response-format.md` — Load when writing the final research report
