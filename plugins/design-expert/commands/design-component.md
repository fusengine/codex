---
description: "Routes single-component generation by register and move: taste-first for brand generation/redesign, existing-token component workflow otherwise."
---

# /prompts:design-component — Single Component (COMPONENT scope)

Generate one UI component through the applicable register + move workflow.

**Complete documentation**: `skills/taste-first/SKILL.md` for its lane; otherwise
`skills/design-web/SKILL.md` or `skills/design-webapp/SKILL.md`.

## Usage

```
/prompts:design-component pricing card with 3 tiers
/prompts:design-component testimonial carousel
/prompts:design-component data table with sorting
```

## Prerequisites
Resolve register and move first. Outside taste-first, `design-system.md` must exist at
project root; if missing, use `/prompts:design` instead.

## Workflow

1. Resolve register and move from the request and owning surface.
2. For `brand` + `generate`/`redesign`, read `skills/taste-first/SKILL.md` and follow it
   exclusively, including its desktop/mobile first-frame evidence.
3. For every other route, read the existing `design-system.md`, then use
   `skills/design-web/SKILL.md` or `skills/design-webapp/SKILL.md` for the owning surface.
   COMPONENT scope skips inspiration browsing and reuses existing tokens.
4. Generate the isolated component with its required size/state/color variants, then run
   `skills/design-motion/SKILL.md` and component-scoped `skills/design-review/SKILL.md`.

## Forbidden
Loading generic creative requirements into taste-first. Outside taste-first, creating a
new `design-system.md`, browsing inspiration, or skipping component validation.
