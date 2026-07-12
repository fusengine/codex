---
name: design-page
description: "New page in an existing project. Use when design-system.md exists, identity is already defined, and a page needs inspiration browsing, Gemini generation, motion, audit, and review."
---

# /design:page — New Page (Phases 1→6)

Add a new page to a project that already has a design-system.md.

## Usage

```
/design:page about page
/design:page contact form with map
/design:page team members grid
```

## Prerequisites

- design-system.md must exist at project root
- If missing, use /design instead (full pipeline)

## Workflow

1. **Read design-system.md** completely. Extract tokens, typography, reference site.

2. **Phase 1 — RESEARCH**: Browse 2 sites matching the page type via fuse-browser. Same process as /design: navigate → scroll → wait → screenshot → 5 observations per site. Declare reference + 3 elements to reproduce.

3. **Phase 3 — GENERATE**: Map existing design-system.md to 7 Gemini XML blocks:
   - Identity → `<aesthetics>`, Reference → `<style_reference>`, Typography → `<typography>`
   - OKLCH → `<color_system>`, Spacing → `<spacing>`, (always) → `<states>`, Forbidden → `<forbidden>`
   - Call mcp__gemini-design__create_frontend with ALL 7 blocks
   - Apply component variants (Glass/Outline/Flat)

4. **Phase 4 — MOTION**: Add animations via mcp__gemini-design__modify_frontend. Match motion profile from design-system.md (scroll reveals, hover transitions, focus rings).

5. **Phase 5 — AUDIT**: Same checks as /design. Verify contrast >= 4.5:1 text / 3:1 UI. Check font compliance. Confirm OKLCH token adherence. Validate consistency with existing pages.

6. **Phase 6 — REVIEW**: python3 -m http.server 8899 → screenshot light (fullPage) → toggle .dark → screenshot dark. Compare 3 declared elements [expected vs present]. Fix gaps with modify_frontend (max 2 cycles). Report.

## FORBIDDEN

Same as /design. Additionally: creating a new design-system.md (use existing one).

## Related skills

[design-method](../design-method/SKILL.md), [design-web](../design-web/SKILL.md), [design-motion](../design-motion/SKILL.md), and [design-review](../design-review/SKILL.md).

## Skill routing metadata

related-skills: design-method, design-web, design-motion, design-review
