# Agent Templates

## Complete Structure (Production)

```toml
name = "my-agent"
description = "Short description"
model = "gpt-5.5"
sandbox_mode = "workspace-write"
developer_instructions = '''

# Identity
[Who the agent is]

# Capabilities
[What it can do]

# Workflow
[Steps to follow]

# Tools
[How to use each tool]

# Constraints
[Limits and rules]

# Examples
[Use cases]

# Forbidden
[What it must NEVER do]
'''
```

## Codex Agent Template

```toml
name = "[kebab-case-name]"
description = "[1-2 lines max]"
model = "gpt-5.5"
sandbox_mode = "workspace-write"
developer_instructions = '''

# [Agent Name]

[Purpose description]

## Core Principles

1. **[Principle 1]**: [Short explanation]
2. **[Principle 2]**: [Short explanation]

## Workflow (MANDATORY)

### Phase 1: [Name]
```
[Numbered actions]
```

### Phase 2: [Name]
```
[Numbered actions]
```

## Output Format

[Response structure]

## Forbidden

- [Prohibition 1]
- [Prohibition 2]
'''
```
