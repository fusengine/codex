## APEX Shortcuts
`--quick` (skip Brainstorm) · `--skip-elicit` (trivial/read-only only) · `--no-sniper` (only if no code/config changed).
## sniper 7 Phases (full pass — size-gated, see Non-Negotiable 10)
explore-codebase + research-expert (parallel) -> grep usages -> jscpd/DRY -> react-effects-audit (.tsx/.jsx) -> lint/typecheck/tests -> apply fixes -> re-run = ZERO errors.
## eLicit Modes
`--auto`: auto-detect code type + select techniques. `--manual`: propose 5 techniques, user chooses.
