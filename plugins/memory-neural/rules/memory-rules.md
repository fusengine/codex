---
description: "Neural Memory Rules - Bio-inspired memory for all agents"
alwaysApply: true
---

## Memory Neural Rules

### Automatic Behaviors
- When encountering repeated errors, ALWAYS search memory first
- Use mcp__graphiti__search_nodes for episodic recall
- Use mcp__qdrant__qdrant-find for semantic search
- After solving a problem, store the lesson via mcp__graphiti__add_episode
- After storing in graph, also store in Qdrant via mcp__qdrant__qdrant-store

### Salience Gate (Amygdale)
priority = 0.40 * severity + 0.30 * recency + 0.20 * frequency + 0.10 * outcome
- STORE_THRESHOLD = 0.30
- HIGH_PRIORITY = 0.70
- Only store if severity > 3/10 or recurrence > 2

### Decay (Power Law)
R(t) = strength * (1 + time_days) ^ (-decay_rate)
- decay_rate = max(0.1, 0.5 - rehearsals * 0.05)
- prune if retention < 0.10

### Hebbian Learning (LTP/LTD)
- LTP: edge.weight += 0.1 * activation_a * activation_b
- LTD: edge.weight *= 0.95 (weekly decay if unused)
- Prune: DELETE edge WHERE weight < 0.01

### Storage Format
When storing a lesson, include:
- error_type: The category of error
- context: Project type, file, function
- solution: What fixed it
- severity: 1-10 scale
- tags: Relevant keywords
