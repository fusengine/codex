---
name: registration
description: How to make skills available in Codex plugins
when-to-use: After creating a skill, to make it loadable
keywords: registration, skill, plugin, codex, manifest
priority: high
related: architecture.md
---

# Skill Registration

## Overview

In this Codex plugin repository, skills live under `plugins/<plugin>/skills/<skill-name>/SKILL.md`.

The plugin manifest points Codex at the skills directory:

```json
{
  "skills": "./skills/"
}
```

---

## Step 1: Create Skill Directory

```
plugins/<plugin>/skills/<skill-name>/SKILL.md
plugins/<plugin>/skills/<skill-name>/references/
```

The folder name must match the skill `name` in frontmatter.

---

## Step 2: Check Skill Frontmatter

```yaml
---
name: skill-name
description: Use when <trigger>. Covers <scope>.
user-invocable: true
references: references/patterns.md
related-skills: other-skill
---
```

### Rules

| Rule | Reason |
|------|--------|
| Exact name match | Loader and user-facing skill name stay aligned |
| Clear description | Codex uses it for skill selection |
| Valid references | Referenced files must exist |
| English content | Repository standard |

---

## Step 3: Check Plugin Manifest

Local manifest:

```
plugins/<plugin>/.codex-plugin/plugin.json
```

Required when the plugin exposes skills:

```json
{
  "skills": "./skills/"
}
```

---

## Verification

After registration:

1. Parse `.codex-plugin/plugin.json` as JSON.
2. Confirm `skills` points at `./skills/`.
3. Confirm every ported skill has `SKILL.md`.
4. Confirm every `references:` path exists.
5. Search for legacy non-Codex primitives before calling it done.

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Skill not found | Missing `SKILL.md` or wrong folder | Align folder and `name` |
| References fail | Path listed but file missing | Create file or remove reference |
| Legacy wording remains | Unported source text | Replace with Codex terms |
| Plugin skills missing | Manifest has no `skills` pointer | Add `"skills": "./skills/"` |
