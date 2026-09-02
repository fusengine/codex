---
name: registration
description: How a new agent actually becomes discoverable (no per-agent manifest entry)
when-to-use: Making an agent available after creation
keywords: registration, marketplace, plugin.json, manifest, auto-discovery
priority: high
related: architecture.md, frontmatter.md
---

# Agent Registration

## Overview

A Codex agent does **not** need a per-agent entry anywhere. Drop a valid
`plugins/<plugin>/agents/<name>.toml` on disk (see [frontmatter.md](frontmatter.md)
for required keys) and the setup/update installer picks it up automatically,
copying every `agents/*.toml` in the plugin into `~/.codex/agents/` on
install/update. There is no manifest file that lists agents one by one —
neither the plugin's own manifest nor the repo-root marketplace registry
declares an `"agents"` array; that key does not exist in either file today.

Two real manifests exist, at two different scopes, and neither is about
individual agents:

---

## `.codex-plugin/plugin.json` (per plugin)

Local manifest for a single plugin. Verified fields, e.g.
`plugins/typescript-expert/.codex-plugin/plugin.json`:

```json
{
  "name": "typescript-expert",
  "version": "1.0.14",
  "description": "Expert TypeScript for pure TS projects: CLI tools, libraries, scripts, and backends on Node or Bun with SOLID principles.",
  "author": {
    "name": "Fusengine",
    "email": "hello@fusengine.ch",
    "url": "https://github.com/fusengine"
  },
  "repository": "https://github.com/fusengine/agents",
  "homepage": "https://github.com/fusengine/agents",
  "license": "MIT",
  "keywords": ["typescript", "node", "bun", "cli", "library", "backend"],
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json",
  "interface": {
    "displayName": "TypeScript Expert",
    "shortDescription": "Pure TypeScript, Node, Bun, tooling, tests, and packaging",
    "developerName": "Fusengine"
  }
}
```

`skills` and `hooks` are single path strings pointing at the plugin's skills
directory and hook config — not arrays of individual files. There is no field
here that enumerates agent files.

---

## `.agents/plugins/marketplace.json` (repo root)

Lists **plugins**, not agents. Each entry:

```json
{
  "name": "typescript-expert",
  "source": { "source": "local", "path": "./plugins/typescript-expert" },
  "version": "1.0.14",
  "category": "Framework",
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" }
}
```

Adding a new agent to an existing plugin requires **no change** to this file
— only a new plugin (a new `plugins/<name>/` directory with its own
`.codex-plugin/plugin.json`) needs a new entry here.

---

## Required Fields

### `.codex-plugin/plugin.json`

| Field | Description |
|-------|-------------|
| `name` | Plugin identifier, matches the folder name |
| `version` | Semantic version — bump on any change inside the plugin |
| `description` | Plugin description |
| `skills` | Path to the skills directory (`"./skills/"`) |
| `hooks` | Path to the hook config, if the plugin ships one (`"./hooks/hooks.json"`) |

### `.agents/plugins/marketplace.json` entry

| Field | Description |
|-------|-------------|
| `name` | Plugin identifier, matches `plugin.json`'s `name` |
| `source.path` | Relative path to the plugin directory |
| `version` | Must track `plugin.json`'s `version` |
| `category` | e.g. `Framework`, `Productivity` |
| `policy` | `installation` / `authentication` flags |

---

## Registration Steps

### New agent in an existing plugin

1. Write `plugins/<plugin>/agents/<name>.toml` (see [frontmatter.md](frontmatter.md)).
2. Bump `version` in the plugin's `.codex-plugin/plugin.json`.
3. Nothing to add to `.agents/plugins/marketplace.json` — the plugin entry
   already covers every agent inside it.
4. Validate with `sniper`.

### Brand-new plugin

1. Create `plugins/<new-plugin>/` with `agents/`, `skills/`, and
   `.codex-plugin/plugin.json`.
2. Add one entry for the plugin to `.agents/plugins/marketplace.json`
   (`name`, `source.path`, `version`, `category`, `policy`).
3. Keep both versions in sync.
4. Validate with `sniper`.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Adding an agent-file array to `plugin.json` or `marketplace.json` | Do nothing — `agents/*.toml` files are auto-discovered, no array to maintain |
| Forgetting to bump `plugin.json`'s `version` after a change | Bump it — stale versions make doc/version parity checks fail |
| Mismatched plugin name between `plugin.json` and its folder | Keep the folder name and `name` field identical |
| Assuming a new plugin appears without a `marketplace.json` entry | Add the plugin entry — this step is real, only the per-agent entry is not |

---

## Verification

After adding an agent or plugin:

1. `ls plugins/<plugin>/agents/*.toml` shows the new file.
2. `grep -c '"name"' .agents/plugins/marketplace.json` — for a new plugin, the
   count increases by one; for a new agent in an existing plugin, it does not
   change.
3. Run `sniper` — no manifest edit is required for the agent itself.

---

## Best Practices

| DO | DON'T |
|----|-------|
| Match plugin folder name to `plugin.json`'s `name` | Use a different name in the two places |
| Bump `plugin.json`'s `version` on every change | Keep a stale version |
| Add a `marketplace.json` entry only for a genuinely new plugin | Add one per agent — there is no such granularity |
| Test discovery after install/update | Assume a dropped `.toml` works without ever running the installer |
