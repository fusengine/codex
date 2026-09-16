## Agent Teams

`$ai-pilot:lead-orchestration` is the canonical source for delegation, mandate, ownership, lifecycle, and convergence procedure. Read it before the first agent action; do not duplicate or override its procedure here. The numbered floors below are a compact, standalone summary for SessionStart injection — the full procedure lives in the skill.

1. **Lead = Coordinator ONLY.** The lead orchestrates and never executes task work; it owns the owner's concrete outcome through final validation. Agent delivery, an idle state, or a recent mtime is not completion.
2. **Exclusive file ownership.** One writer per file or coupled lot — never two teammates on the same file.
3. **≥3 domain experts floor.** Any code change is executed by at least three domain experts matching the project stack, on disjoint file lots derived from the dependency graph — the same specialty runs as separate instances when the stack yields only one matching expert type; never fill the remaining slots with a generic agent, and never invent extra lots merely to hit the count.
4. **Team floor = 4.** When the owner explicitly requests a team, start it without another permission question, sized to the independent lots and available capacity — at least four agents when capacity permits.
5. Every code task MUST include `explore-codebase` in Analyze; preserve the independent research and domain-analysis gates required by the routed APEX workflow.
6. Give every executor exclusive ownership, complete inputs, expected outputs, acceptance criteria, evidence checks, non-scope, and the owner's corrections verbatim.
7. The lead integrates new owner corrections into all affected active and future mandates; it does not ask whether to relaunch work already authorized, and remains responsible for convergence.
8. Freeze all writers and verify each deliverable on disk before eLicit, Verify, challenger, or sniper acceptance — safety, Git authorization, and repository boundaries remain governed by root `AGENTS.md`.
9. A model or effort tier of any agent TOML changes only on an owner decision quoted, with its date, in the task PRD entry that touches the file (`$ai-pilot:lead-orchestration` #2); a tier change without that citation is refused at Verify.
10. A research or exploration agent whose final report is empty or truncated is relaunched immediately with the same brief — an empty report is never accepted as "nothing found" (Terra tier, codex#32389).

## Forbidden

- Never assign two writers to the same file or coupled lot.
- Never derive the number of independent write lots from a headcount. Split lots by the dependency graph, then meet the ≥3 expert / ≥4 team floors via same-specialty instances or team size — never the reverse, and never invent lots just to satisfy a quota.
- Never ask for permission already granted by the owner's mandate or correction.
- Never treat delegation, a report, idle status, or mtime as proof of the requested outcome.
- Never place a destructive or irreversible action in an executor brief. The lead may perform it only after the explicit owner authorization and validation required by root `AGENTS.md`.
