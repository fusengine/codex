---
description: "Routes a full web or web-app design by register and move: taste-first for brand generate/redesign, generic design-method otherwise. Use /prompts:design-mobile for iOS/Android."
---

# /prompts:design — Full Pipeline (FULL scope)

Generate a complete design from scratch — no `design-system.md` exists yet, or a full redesign was requested.

**Complete documentation**: `skills/taste-first/SKILL.md` or
`skills/design-method/SKILL.md`, selected by register + move.

## Usage

```
/prompts:design hero section for fintech startup
/prompts:design landing page for physiotherapy clinic
/prompts:design dashboard for a project management SaaS
```

## Workflow

1. Resolve register and move from the request.
2. For `brand` + `generate`/`redesign`, read `skills/taste-first/SKILL.md` and follow it
   exclusively.
3. For every other route, read `skills/design-method/SKILL.md` and follow its generic
   move and target-skill chain.

## Copy
Outside taste-first, `design-method` decides when `skills/ux-copy/SKILL.md` applies.
Inside taste-first, load it only if the canonical skill requests it after concept lock.

## Forbidden
Bypassing register + move routing. Loading generic creative requirements into
taste-first. Restating either workflow instead of following its canonical skill.
