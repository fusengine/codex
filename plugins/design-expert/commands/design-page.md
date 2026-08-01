---
description: "Routes a new page or screen in an existing project by register and move; taste-first may defer existing tokens until concept lock."
---

# /prompts:design-page — New Page (PAGE scope)

Add a new page/screen to a project that already has a `design-system.md`.

**Complete documentation**: `skills/taste-first/SKILL.md` or
`skills/design-method/SKILL.md`, selected by register + move.

## Usage

```
/prompts:design-page about page
/prompts:design-page contact form with map
/prompts:design-page team members grid
/prompts:design-page settings screen for the dashboard
```

## Prerequisites

Resolve register and move first. Outside taste-first, `design-system.md` must exist at
project root; if missing, use `/prompts:design` instead.

## Workflow

1. Resolve register and move from the request and existing surface.
2. For `brand` + `generate`/`redesign`, read `skills/taste-first/SKILL.md` and follow it
   exclusively; treat existing tokens only as owner constraints it identifies.
3. For every other route, read `skills/design-method/SKILL.md` and follow its generic
   page workflow with the existing design system.

## Forbidden
Loading generic creative requirements into taste-first. Outside taste-first, creating a
new `design-system.md` instead of reusing the existing one. Everything forbidden in
`/prompts:design` also applies here.
