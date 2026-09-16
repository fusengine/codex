---
name: file-size-rules
description: File size limits, LoC calculation, and split strategies for code quality
when-to-use: Checking file sizes, splitting large files
keywords: file size, LoC, lines of code, split, refactor
priority: high
related: solid-validation.md, architecture-patterns.md
---

# File Size Rules

## Limits

`FUSE_SOLID_MAX_LINES` is the only file-size ceiling. Use its positive integer value when set; otherwise use the default of 200 total lines.

| Measurement | Result | Action |
|-------------|--------|--------|
| **Total lines** <= effective `FUSE_SOLID_MAX_LINES` | Within the file-size ceiling | Validate responsibilities normally |
| **Total lines** > effective `FUSE_SOLID_MAX_LINES` | Above the file-size ceiling | Split by responsibility until every resulting file complies |

Do not introduce a separate code-only, comment, blank-line, file-count, or change-size limit.

## LoC Calculation

```
LoC = Total lines - Comment lines - Blank lines

Comment patterns:
- JS/TS: //, /* */, /** */
- Python: #, """ """, ''' '''
- Go: //, /* */
- PHP: //, #, /* */
- Rust: //, /* */, ///
```

Code-only LoC can describe code density, but it is diagnostic only. Comments and blank lines remain part of the total-line comparison against `FUSE_SOLID_MAX_LINES`; the calculation above never creates another pass/fail threshold.

## Split Strategy

```
component.tsx exceeds the configured ceiling and mixes responsibilities
├── Component.tsx - composition and orchestration
├── ComponentHeader.tsx - header rendering
├── ComponentContent.tsx - content rendering
├── useComponentLogic.ts - state and behavior
└── index.ts - public exports
```

Split only along real responsibility boundaries. File length identifies when a split is required; it does not justify arbitrary fragments or speculative abstractions.
