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
show code-reviewer

# Use a template (copy and customize)
use code-reviewer

# Use with customization
use code-reviewer with language python and security focus
```

## Agent Structure

Agent templates are written as portable prompt templates. When installing one as
a real Codex subagent, convert its metadata to TOML:

```toml
name = "agent-name"
description = "Clear description for automatic triggering"
model = "gpt-5.5"
sandbox_mode = "workspace-write"
developer_instructions = '''
# Agent Name

Instructions and process.
'''
```

### Required Fields

| Field | Description | Values |
|-------|-------------|--------|
| `name` | Unique identifier | kebab-case |
| `description` | Trigger + usage context | Descriptive text |
| `model` | Codex model to use | Runtime-supported model id |
| `sandbox_mode` | File access mode | Usually `workspace-write` |
| `developer_instructions` | Agent instructions | TOML multiline string |

### Agent Body

After the YAML frontmatter, the Markdown body contains:
- Instructions and processes
- Output formats
- Examples and patterns
- Rules and prohibitions (Forbidden)

## Contribution

To add an agent:

1. Create the `.md` file in the appropriate category (`agents/`, `tasks/`, `specialized/`)
2. Use the standard YAML frontmatter (name, description, model, color, tools, skills)
3. Test the agent with at least 3 use cases
4. Document output formats and rules (Forbidden)
