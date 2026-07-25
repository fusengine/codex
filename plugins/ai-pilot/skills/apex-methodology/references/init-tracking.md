---
name: init-tracking
description: APEX task-tracking initialization command (Step 0, mandatory first action)
---

# Step 0: Initialize Tracking

**BEFORE anything else**, run this command to initialize APEX tracking.

## Task Slug

Every artefact in `.harness/apex/` (task id, docs, verify/elicit proofs) is keyed on one `{task-slug}`, derived — in order of preference — from:

1. An explicit tracked-task id, if this task is already tracked (`APEX_TASK_SLUG` below).
2. The current git branch name, stripped of its `type/` prefix and slugified.
3. A `task-<unix-timestamp>` fallback when neither is available (detached HEAD, no branch).

```bash
TASK_SLUG="${APEX_TASK_SLUG:-}"
[ -z "$TASK_SLUG" ] && TASK_SLUG=$(git branch --show-current 2>/dev/null \
  | sed -E 's#.*/##; s/[^a-zA-Z0-9]+/-/g; s/^-+|-+$//g' | tr '[:upper:]' '[:lower:]')
[ -z "$TASK_SLUG" ] && TASK_SLUG="task-$(date +%s)"
```

`{task-slug}` is the same value used everywhere else in APEX: `docs/task-{task-slug}.md` (working notes), `docs/verify-{task-slug}.md` (Verify proof), `docs/elicit-{task-slug}.json` (eLicit proof).

## Command

```bash
TASK_SUBJECT="<the real task description>"   # e.g. "$ARGUMENTS" from the invoking command
NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
mkdir -p .harness/apex/docs
jq -n --arg slug "$TASK_SLUG" --arg subject "$TASK_SUBJECT" --arg now "$NOW" \
  '{current_task: $slug, created_at: $now, tasks: {($slug): {
      subject: $subject, status: "in_progress", phase: "init-branch",
      started_at: $now, doc_consulted: {}
    }}}'
```

This produces **exactly** this literal shape — copy it, do not paraphrase or re-derive any
field's type from its name:

```json
{
  "current_task": "{task-slug}",
  "created_at": "{ISO-8601 UTC}",
  "tasks": {
    "{task-slug}": {
      "subject": "{the real task description}",
      "status": "in_progress",
      "phase": "init-branch",
      "started_at": "{ISO-8601 UTC}",
      "doc_consulted": {}
    }
  }
}
```

Field shapes, non-negotiable (this is what broke in a real run — the model wrote
`"doc_consulted": false` where the schema requires an object):
- `doc_consulted` is always a JSON **object** (`{}` when empty, never `false`, `null`, or
  omitted) — it is a map of framework-name -> consultation record, populated later by
  `plugins/ai-pilot/scripts/track-doc-consultation.native.ts`, not a yes/no flag.
- `status` and `phase` are always JSON **strings** from the fixed vocabularies used across
  this skill (`status`: `"in_progress"` | `"completed"`; `phase`: the phase-file basenames,
  e.g. `"init-branch"`, `"analyze-code"`, `"execution"` -- see `references/00-init-branch.md`
  through `references/09-create-pr.md`), never a boolean or number.

The command above **prints the JSON to STDOUT — it does not write the file.** Persist that
output to `.harness/apex/task.json` with your native write tool (`apply_patch` under Codex,
`Write` under Claude Code), then confirm:

```bash
echo "✅ APEX tracking initialized in $(pwd)/.harness/apex/ (task: $TASK_SLUG)"
```

Build the JSON with `jq -n` and print it to STDOUT — two separate prohibitions, two separate reasons:
- **Never a heredoc**: `TASK_SUBJECT` is the user's raw request and commonly contains `"` or `` ` `` — string-interpolating it into a heredoc produces invalid JSON (verified: a heredoc with quotes in the subject breaks `jq .` with a parse error). `jq --arg` escapes it correctly regardless of content.
- **Never a shell redirect (`>`)**: piping the `jq -n` output straight to `... > .harness/apex/task.json` trips the "Shell redirect to file detected" guard-rail. Under `codex exec` (no interactive approval channel), that guard-rail degrades to a hard DENY — verified 3× in a real run, each time silently costing a turn. Print to STDOUT and write the file with your native tool instead; that tool call is not a shell redirect and does not trip the guard.

This creates:
- `.harness/apex/task.json` — tracks documentation consultation status, current phase, and subject (see `phase` field, updated by each phase reference — `references/00-init-branch.md` through `references/09-create-pr.md`)
- `.harness/apex/docs/` — stores consulted documentation summaries

**The PreToolUse hooks will BLOCK Write/Edit until documentation is consulted.**
