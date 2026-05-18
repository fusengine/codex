# Neural Memory (fuse-memory)

Bio-inspired persistent memory for Codex using Graphiti + Qdrant.

## Architecture

| Brain Region | Implementation |
|-------------|---------------|
| Amygdala | Salience scoring (threshold 0.30) |
| Hippocampus | Graphiti + FalkorDB (episodic) |
| Neocortex | Qdrant vector store (semantic) |
| LTP/LTD | Hebbian edge weight via cron |

## No Dedicated Agent

This plugin uses **hooks + MCP + rules only**. All existing agents automatically interact with memory via injected instructions.

## Hooks

| Hook | Trigger | Action |
|------|---------|--------|
| PostToolUse (Bash) | Bash exit_code != 0 | Auto-capture error to Graphiti + instruct Qdrant store |
| SessionStart | Session begins | Recall relevant lessons from Graphiti |
| PostToolUse (MCP) | graphiti/qdrant calls | Log operations to ${CODEX_HOME:-~/.codex}/fusengine/logs/00-memory/ |

## MCP Servers

- **graphiti** (HTTP) - Knowledge graph at `http://NEURAL_MEMORY_HOST:8000/mcp/`
- **qdrant** (stdio) - Vector store via `uvx mcp-server-qdrant`

## Command

`/fuse-memory:memory <subcommand>`

| Subcommand | Description |
|------------|-------------|
| `search <query>` | Search Graphiti + Qdrant |
| `store <lesson>` | Store lesson manually |
| `stats` | Memory statistics |
| `consolidate` | Force consolidation |
| `decay` | Force decay/pruning |

## Infrastructure

See `Neuronal-Project/README.md` for Docker setup (4 services, ~5.5 GiB RAM).

## Formulas

- **Salience**: `0.40*severity + 0.30*recency + 0.20*frequency + 0.10*outcome`
- **Decay**: `R(t) = strength * (1 + t)^(-decay_rate)`
- **Hebbian LTP**: `edge.weight += 0.1 * activation_a * activation_b`
