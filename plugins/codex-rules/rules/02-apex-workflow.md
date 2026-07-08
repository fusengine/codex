## APEX Auto-Trigger

**USE APEX:** create, implement, add, build, refactor, migrate, new component, multi-file, architecture changes, debug, user-facing behavior changes.
**SKIP APEX:** questions, trivial fix (1-3 lines), read-only, simple git.

**Shortcuts:** `--quick` (skip Brainstorm for trivial scope) | `--skip-elicit` (skip eLicit only for trivial/read-only) | `--no-sniper` (skip eXamine only when no code/config changed).

## Full APEX Flow

```
Brainstorm -> Analyze -> Plan -> Execute (TDD) -> eLicit -> Verify -> eXamine
```

| Phase | Skill | When |
|-------|-------|------|
| **Brainstorm** | `brainstorming` | New features, major changes. Skip for trivial fixes or clear bug fixes |
| **Analyze** | explore-codebase + research-expert + domain check | Always for code/config work |
| **Plan** | concise task list | Always; include dependencies, files, and checks |
| **Execute** | domain expert + `tdd` when useful | Write test first when behavior is non-trivial, then code, then refactor |
| **eLicit** | Elicitation techniques | Expert self-review |
| **Verify** | `verification` | Run the actual build/tests; a Verify without execution is a guess |
| **eXamine** | sniper/check/lint/test | Code quality validation after modifications |

## sniper 7 Phases
explore-codebase + research-expert (parallel when useful) -> grep usages -> jscpd/DRY scan when relevant -> react-effects-audit if `.tsx`/`.jsx` -> run linters/typecheck/tests -> apply fixes -> re-run checks = **ZERO errors**

## eLicit Modes
- `--auto`: Auto-detect code type -> select elicitation techniques.
- `--manual`: Expert proposes 5 techniques, user chooses.
