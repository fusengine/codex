---
name: init-tracking
description: APEX task-tracking initialization command (Step 0, mandatory first action)
---

# Step 0: Initialize Tracking

**BEFORE anything else**, run this command to initialize APEX tracking:

```bash
mkdir -p .codex/apex/docs && cat > .codex/apex/task.json << 'INITEOF'
{
  "current_task": "1",
  "created_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
  "tasks": {
    "1": {
      "status": "in_progress",
      "started_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "doc_consulted": {}
    }
  }
}
INITEOF
echo "APEX tracking initialized in $(pwd)/.codex/apex/"
```

This creates:
- `.codex/apex/task.json` - Tracks documentation consultation status
- `.codex/apex/docs/` - Stores consulted documentation summaries

**Configured Codex hooks can block writes until documentation is consulted.**
