---
name: architecture
description: Skill directory structure and file organization
---

# Skill Architecture

## Overview

Every skill follows a consistent directory structure for predictability and auto-discovery.

---

## Structure & File Types

```
plugins/<plugin>/skills/<skill-name>/
├── SKILL.md                    # Entry point (~150 lines)
└── references/                 # Conceptual docs (150 max)
    ├── installation.md
    ├── core-concepts.md
    └── templates/              # Complete code (no limit)
        └── basic-setup.md
```

---

## File Roles

| File | Contains | Key Point |
|------|----------|-----------|
| **SKILL.md** | Overview, rules, links | Points to references/templates |
| **References** | WHY, WHEN, decision guides | Minimal code, conceptual |
| **Templates** | Complete working code | Copy-paste ready |

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Skill folder | kebab-case | `tanstack-query` |
| SKILL.md | Uppercase | `SKILL.md` |
| References | kebab-case | `core-concepts.md` |
| Templates | PascalCase or kebab-case | `BasicSetup.md` |

---

## Frontmatter Requirements

### SKILL.md (Codex — name + description ONLY)

```yaml
---
name: skill-name
description: Use when [trigger]. Covers [topics].
---
```

Any other metadata (version, related skills, keywords) goes in prose in the body — Codex parses only `name` and `description`.

### References / Templates (internal metadata only)

Reference and template files are plain markdown; their frontmatter is an internal authoring convention (not parsed by Codex). Keep it light — a `name` and `description` line is enough:

```yaml
---
name: reference-name
description: What this covers
---
```

---

## Linking Strategy

| From | To | Format |
|------|----|--------|
| SKILL.md | Reference | `[name](references/name.md)` |
| SKILL.md | Template | `[name](references/templates/name.md)` |
| Reference | Template | `→ See [template.md](templates/template.md)` |
| Reference | Reference | `[related](related.md)` |

---

## Best Practices

| DO | DON'T |
|----|-------|
| Keep SKILL.md as index/guide | Put all docs in SKILL.md |
| Split topics into references | Mix concepts with code |
| Link references to templates | Forget frontmatter |
| Use consistent naming | Use inconsistent naming |
