---
name: prompt-library
description: "Library of 18+ ready-to-use prompt templates and executable agents. Use when: looking for a ready-made agent or task template (code review, support, data analysis, translation, extraction, etc.) instead of writing one from scratch."
---

# Prompt Library

Collection of professional, tested, and optimized prompt templates.

## Categories

### Agents (6 executable agents)

| Template | Description | Usage |
|----------|-------------|-------|
| [code-reviewer](templates/agents/code-reviewer.md) | Code review with SOLID | `/prompt library use code-reviewer` |
| [support-assistant](templates/agents/support-assistant.md) | Multichannel customer support | `/prompt library use support-assistant` |
| [data-analyst](templates/agents/data-analyst.md) | Data analysis | `/prompt library use data-analyst` |
| [technical-writer](templates/agents/technical-writer.md) | Technical documentation | `/prompt library use technical-writer` |
| [security-auditor](templates/agents/security-auditor.md) | OWASP security audit | `/prompt library use security-auditor` |
| [api-designer](templates/agents/api-designer.md) | REST/GraphQL API design | `/prompt library use api-designer` |

### Tasks (6 executable agents)

| Template | Description | Usage |
|----------|-------------|-------|
| [summarizer](templates/tasks/summarizer.md) | Adaptive text summarization | `/prompt library use summarizer` |
| [translator](templates/tasks/translator.md) | Multilingual translation | `/prompt library use translator` |
| [extractor](templates/tasks/extractor.md) | Structured data extraction | `/prompt library use extractor` |
| [classifier](templates/tasks/classifier.md) | Content classification | `/prompt library use classifier` |
| [generator](templates/tasks/generator.md) | Content generation | `/prompt library use generator` |
| [validator](templates/tasks/validator.md) | Data validation | `/prompt library use validator` |

### Specialized (6 executable agents)

| Template | Description | Usage |
|----------|-------------|-------|
| [legal-assistant](templates/specialized/legal-assistant.md) | Legal analysis | `/prompt library use legal-assistant` |
| [medical-writer](templates/specialized/medical-writer.md) | Medical writing | `/prompt library use medical-writer` |
| [financial-analyst](templates/specialized/financial-analyst.md) | Financial analysis | `/prompt library use financial-analyst` |
| [marketing-strategist](templates/specialized/marketing-strategist.md) | Marketing strategy | `/prompt library use marketing-strategist` |
| [hr-assistant](templates/specialized/hr-assistant.md) | Human resources | `/prompt library use hr-assistant` |
| [educational-tutor](templates/specialized/educational-tutor.md) | Educational tutoring | `/prompt library use educational-tutor` |

## Commands

```bash
# List all templates
/prompt library list

# Search for a template
/prompt library search "code review"

# View a template
/prompt library show code-reviewer

# Use a template (copy and customize)
/prompt library use code-reviewer

# Use with customization
/prompt library use code-reviewer --lang python --focus security
```

## Agent Structure

Each agent is a Codex `.toml` definition (in `.codex/agents/<name>.toml` or a plugin's `agents/`):

```toml
name = "agent-name"
description = "Trigger + usage context — Use when… / Do NOT use for…"
model = "gpt-5.6-terra"            # gpt-5.6-sol | gpt-5.6-terra | gpt-5.6-luna
model_reasoning_effort = "high"    # minimal | low | medium | high | xhigh
sandbox_mode = "workspace-write"   # read-only | workspace-write | danger-full-access
developer_instructions = '''
<agent instructions: process, output format, examples, Forbidden>
'''

[[skills.config]]
path = "plugins/<plugin>/skills/<skill>/SKILL.md"
enabled = true
```

### Required Fields

| Field | Description | Values |
|-------|-------------|--------|
| `name` | Unique identifier | kebab-case |
| `description` | Trigger + usage context | Descriptive text (Use when… / Do NOT use for…) |
| `developer_instructions` | Agent body (required) | Multi-line `'''…'''` string |
| `model` | Codex model | `gpt-5.6-terra` (default), `gpt-5.6-sol` (heavy reasoning), `gpt-5.6-luna` |
| `model_reasoning_effort` | Reasoning budget | `minimal` … `high` … `xhigh` |
| `sandbox_mode` | Filesystem access | `read-only`, `workspace-write`, `danger-full-access` |
| `nickname_candidates` | Optional display names | list of strings |
| `[[skills.config]]` | Attached skills | `path` + `enabled` per skill |

### Agent Body

`developer_instructions` contains:
- Instructions and processes
- Output formats
- Examples and patterns
- Rules and prohibitions (Forbidden)

## Contribution

To add an agent:

1. Create the `.toml` file in the appropriate category (`agents/`, `tasks/`, `specialized/`)
2. Use the Codex agent schema (name, description, developer_instructions + model, model_reasoning_effort, sandbox_mode, skills.config)
3. Test the agent with at least 3 use cases
4. Document output formats and rules (Forbidden)
