## APEX Shortcuts

**Shortcuts:** `--quick` (skip Brainstorm for trivial scope) | `--skip-elicit` (skip eLicit only for trivial/read-only) | `--no-sniper` (skip eXamine only when no code/config changed).

## sniper 7 Phases
explore-codebase + research-expert (parallel when useful) -> grep usages -> jscpd/DRY scan when relevant -> react-effects-audit if `.tsx`/`.jsx` -> run linters/typecheck/tests -> apply fixes -> re-run checks = **ZERO errors**

## eLicit Modes
- `--auto`: Auto-detect code type -> select elicitation techniques.
- `--manual`: Expert proposes 5 techniques, user chooses.
