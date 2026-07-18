---
name: registration
description: How to make a skill available to an agent
---

# Skill Registration

## Overview

For a skill to be usable by an agent, two things matter:
1. The agent attaches it via `[[skills.config]]` in its `.toml`
2. The plugin is registered in the marketplace manifest (skills are auto-discovered from the plugin dir)

---

## Step 1: Attach in the Agent .toml

Add a `[[skills.config]]` table to the agent that should use the skill:

**Location**: `plugins/<plugin>/agents/<agent>.toml`

```toml
name = "agent-name"
# ...

[[skills.config]]
path = "plugins/<plugin>/skills/<new-skill-name>/SKILL.md"
enabled = true
```

### Important

| Rule | Reason |
|------|--------|
| Exact folder match | `path` must point to the real `SKILL.md` |
| One table per skill | `[[skills.config]]` repeats |
| `enabled = true` | Skill is active |

Users can also invoke a skill directly with `$skill-name` or via `/skills`.

---

## Step 2: Register the Plugin

The skill's plugin must appear in the marketplace manifest:

**Location**: marketplace manifest (repo root)

```json
{
  "plugins": [
    {
      "name": "<plugin>",
      "source": "./plugins/<plugin>",
      "version": "1.0.0"
    }
  ]
}
```

Individual skills are NOT listed — they are auto-discovered from `skills/*/SKILL.md` under the plugin.

---

## Verification

After registration, verify:

| Check | How |
|-------|-----|
| Skill loads | Invoke `$skill-name` in conversation |
| References load | Skill has access to its `references/` |
| No errors | Check for load errors |

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Skill not found | Plugin not in manifest | Add plugin entry |
| Skill not attached | No `[[skills.config]]` | Add the table to the agent |
| Wrong references | Mismatched path | Ensure `path` matches the real `SKILL.md` |

---

## Example Registration

### For a new `tanstack-query` skill in `react-expert`:

**1. Agent .toml** (`plugins/react-expert/agents/react-expert.toml`):
```toml
[[skills.config]]
path = "plugins/react-expert/skills/tanstack-query/SKILL.md"
enabled = true
```

**2. Marketplace manifest**:
```json
{
  "plugins": [
    { "name": "react-expert", "source": "./plugins/react-expert", "version": "1.0.0" }
  ]
}
```

---

## Checklist

- [ ] Added `[[skills.config]]` to the agent `.toml`
- [ ] `path` matches the real `SKILL.md`
- [ ] Plugin registered in the marketplace manifest
- [ ] Folder name matches exactly
- [ ] Tested the skill loads correctly
