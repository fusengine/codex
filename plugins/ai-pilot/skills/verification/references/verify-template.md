# Verification Artifact Template

Write `.codex/apex/docs/verify-{task-slug}.md` during verification Step 6. Derive `{task-slug}` with the same rules as `elicitation/references/artifact-contract.md`: explicit tracking slug, branch slug, tracked task ID, then timestamp.

```markdown
# Verification: {task-slug}

**Date**: {ISO-8601 UTC}
**Original request**: {one-line summary}

## Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion} | PASS/FAIL | {command output, log excerpt, screenshot path, or diff} |

## Regression Check

- [ ] Full test suite passed — {command and result}
- [ ] No new lint/type errors — {evidence}
- [ ] No unrelated files modified — {reviewed file list}

## Side Effects

- [ ] Every modified file reviewed
- [ ] No debug code or secrets left behind

## Verdict

**FUNCTIONALLY RESOLVED** — {evidence summary}
or
**UNRESOLVED** — {remaining items and blocker}
```

One evidence item is required per criterion. If a criterion cannot be verified, report that limitation instead of marking it passed.
