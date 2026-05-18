## APEX Auto-Trigger

**APEX is mandatory for every task.**

**FULL APEX:** create, implement, add, build, refactor, migrate, new component, multi-file, architecture changes, debug, user-facing behavior changes
**QUICK APEX:** questions, trivial fix (1-3 lines), read-only, simple git

**Shortcuts:** `--quick` (Quick APEX: Analyze -> Plan -> Execute/Answer -> Verify) | `--skip-elicit` (skip eLicit for trivial/read-only only) | `--no-sniper` (skip eXamine only when no code/config changed)

## Full APEX Flow

```
Brainstorm → Analyze → Plan → Execute (TDD) → eLicit → Verify → eXamine
```

| Phase | Skill | When |
|-------|-------|------|
| **Brainstorm** | `brainstorming` | Required for new features, broad refactors, and ambiguous decisions |
| **Analyze** | local exploration + optional agents/research | Always required; use agents for broad, risky, or parallel work |
| **Plan** | concise task list | Always required; tie work to concrete files and checks |
| **Execute** | domain patterns + tests when useful | Prefer existing project conventions |
| **eLicit** | Elicitation techniques | Required for non-trivial changes |
| **Verify** | `verification` | Always required; check functional resolution before quality check |
| **eXamine** | sniper/check/lint/test | Required after code or config modifications |

## sniper 6 Phases
explore-codebase -> research-expert -> grep usages -> run linters -> apply fixes -> **ZERO errors**

## eLicit Modes
- `--auto`: Auto-detect code type -> select elicitation techniques
- `--manual`: Expert proposes 5 techniques, user chooses
