---
name: semantic-colors
description: "Canonical iOS semantic color roles (WWDC19, still current) — background, grouped-background, and label hierarchies. Reference by role, never raw RGB/hex."
---

# Semantic Color Roles

Source: WWDC19 (semantic colors introduced), still current. Status: verified.

## Backgrounds
`systemBackground`, `secondarySystemBackground`, `tertiarySystemBackground` —
`systemGroupedBackground` and its secondary/tertiary variants for grouped/table layouts.

## Labels
`label`, `secondaryLabel`, `tertiaryLabel`, `quaternaryLabel` — the standard text
hierarchy, each with automatic light/dark adaptation.

## Rule
Every color in the mockup and handoff spec references one of these roles (or a project
semantic token mapped onto one) — never a hardcoded RGB/hex value. This is what makes
dark mode and increased-contrast accessibility modes work automatically once implemented.
