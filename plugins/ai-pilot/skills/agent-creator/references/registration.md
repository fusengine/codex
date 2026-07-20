---
name: registration
description: How to register a plugin so its agents load
---

# Agent Registration

## Overview

A Codex plugin's agents are auto-discovered from `agents/*.toml`, and its skills from `skills/*/SKILL.md`. The plugin itself must be registered in the marketplace manifest to be installable/discoverable.

---

## Marketplace Manifest Structure

```json
{
  "name": "fusengine-plugins",
  "plugins": [
    {
      "name": "nextjs-expert",
      "source": "./plugins/nextjs-expert",
      "description": "Expert Next.js 16 with App Router...",
      "version": "1.1.0"
    }
  ]
}
```

Agents and skills are NOT listed individually — they are resolved from the plugin directory (`agents/*.toml`, `skills/*/SKILL.md`).

---

## Required Fields

| Field | Description |
|-------|-------------|
| `name` | Plugin identifier |
| `source` | Path to plugin directory |
| `description` | Plugin description |
| `version` | Semantic version |

---

## Registration Steps

### 1. Add the Plugin Entry

```json
{
  "name": "new-expert",
  "source": "./plugins/new-expert",
  "description": "...",
  "version": "1.0.0"
}
```

### 2. Verify the Plugin Layout

- Agent files: `agents/<name>.toml`
- Skill dirs: `skills/<name>/SKILL.md`
- `name` inside each `.toml` matches the filename

### 3. Validate

Run sniper to verify registration.

---

## Plugin.json (Local)

Also keep `.codex-plugin/plugin.json` in the plugin up to date:

```json
{
  "name": "new-expert",
  "version": "1.0.0",
  "description": "..."
}
```

Mirror the same `version` between `.codex-plugin/plugin.json` and the marketplace entry for a plugin listed in `plugins[]`.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Wrong path prefix | Use `./` for relative `source` |
| Agent name mismatch | Match `name` in the `.toml` to the filename |
| Version drift | Keep plugin.json == marketplace version |
| Forgot plugin.json | Update both files |

---

## Verification

After registration:

1. Agent appears in the available agents list
2. Skills are accessible via `$skill-name` / `/skills`
3. No errors on plugin load

---

## Best Practices

| DO | DON'T |
|----|-------|
| Match folder names | Use different names |
| Update version on changes | Keep stale version |
| Keep plugin.json == marketplace version | Let versions drift |
| Test after registration | Assume it works |
