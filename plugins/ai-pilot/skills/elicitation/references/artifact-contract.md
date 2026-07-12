# Artifact Contract

Step 5 writes `.codex/apex/docs/elicit-{task-slug}.json` in addition to the human-facing report. It records `{technique_id, verdict, correction_applied, evidence}` for each technique actually applied. A later elicitation pass loads this artifact and re-applies only failed, deferred, or newly relevant techniques.

Derive `{task-slug}` consistently:

1. Use `task_slug` from `.codex/apex/task.json` when present.
2. Otherwise use the current git branch without its `type/` prefix, slugified.
3. Without a usable branch, use `task-{current_task}` from `.codex/apex/task.json`.
4. Fall back to `task-{unix-timestamp}`.

For example, `feat/use-harness` becomes `use-harness`, not `feat-use-harness`. A mismatched slug prevents later gates from finding the artifact.

See `steps/step-05-report.md` for the JSON schema and `steps/step-00-init.md` for load/diff behavior. Optional per-repository tuning is documented in `elicit-profile.md`.
