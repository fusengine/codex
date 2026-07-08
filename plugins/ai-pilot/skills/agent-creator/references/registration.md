---
name: registration
description: How to make Codex plugin agents discoverable
when-to-use: Making an agent available after creation
keywords: registration, marketplace, json, plugin, manifest, codex
priority: high
related: architecture.md, frontmatter.md
---

# Agent Registration

## Overview

For this plugin ecosystem, keep Codex agents in `plugins/<plugin>/agents/*.toml` and make sure the plugin itself is registered in the root marketplace.

---

## Plugin Marketplace

Root registry: `.agents/plugins/marketplace.json`

```json
{
  "name": "new-plugin",
  "source": {
    "source": "local",
    "path": "./plugins/new-plugin"
  },
  "version": "1.0.0",
  "category": "Framework",
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  }
}
```

---

## Plugin Manifest

Local manifest: `plugins/<plugin>/.codex-plugin/plugin.json`

```json
{
  "name": "new-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json",
  "mcpServers": "./.mcp.json"
}
```

---

## Agent File

Place the agent at:

```
plugins/<plugin>/agents/<agent-name>.toml
```

The TOML must include:

```toml
name = "agent-name"
description = "Trigger guidance."
developer_instructions = '''
# Agent Name
'''
```

---

## Verification

After registration:

1. Parse `.codex-plugin/plugin.json` as JSON.
2. Parse each `agents/*.toml` as TOML.
3. Confirm each agent has `name`, `description`, and `developer_instructions`.
4. Confirm root marketplace points at the plugin path.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Agent saved as `.md` | Use `.toml` |
| Legacy YAML agent config | Use Codex TOML keys |
| Marketplace path wrong | Point to `./plugins/<plugin>` |
| Missing `developer_instructions` | Add the full behavior contract |
