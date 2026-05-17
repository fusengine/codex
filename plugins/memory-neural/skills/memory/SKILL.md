---
name: memory
description: "Neural memory operations - search,store,stats,consolidate (migré depuis slash command)"
---

# Neural Memory Operations

## Usage
- `/fuse-memory:memory search <query>` - Search lessons
- `/fuse-memory:memory store <lesson>` - Store a lesson manually
- `/fuse-memory:memory stats` - Memory statistics
- `/fuse-memory:memory consolidate` - Force consolidation
- `/fuse-memory:memory decay` - Force decay/pruning

## Arguments
`$ARGUMENTS` contains the subcommand and parameters.

## Subcommands

### search
Search both Graphiti (episodic) and Qdrant (semantic):
1. Call mcp__graphiti__search_nodes with the query
2. Call mcp__qdrant__qdrant-find with the query
3. Merge and deduplicate results
4. Present ranked by relevance

### store
Manually store a lesson:
1. Parse the lesson text from arguments
2. Call mcp__graphiti__add_episode with the lesson
3. Call mcp__qdrant__qdrant-store with the lesson
4. Confirm storage with node/vector IDs

### stats
Display memory statistics:
1. Call mcp__graphiti__get_status for graph stats
2. Report: node count, edge count, episode count
3. Show last consolidation timestamp
4. Show log file sizes from ~/.codex/logs/00-memory/

### consolidate
Force episodic to semantic consolidation:
1. Read recent episodes from Graphiti
2. Identify patterns (recurring errors, common solutions)
3. Store consolidated patterns in Qdrant
4. Report consolidation summary

### decay
Force memory decay and pruning:
1. Apply power law decay: R(t) = strength * (1+t)^(-rate)
2. Prune nodes with retention < 0.10
3. Prune edges with weight < 0.01
4. Report pruned count
