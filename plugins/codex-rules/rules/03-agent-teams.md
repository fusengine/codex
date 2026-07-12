## Agent Teams

Use Codex teams/subagents for parallel, broad, risky, or disjoint work when the runtime exposes them and they reduce risk or latency. When a team is created, the lead coordinates ownership, integration, and verification.

Codex 0.144.1 native V2 custom agents require these runtime-proven internal settings:

```toml
[features.multi_agent_v2]
tool_namespace = "fusengine_agents"
hide_spawn_agent_metadata = false
```

Select an exact custom agent with `agent_type` and `fork_turns = "none"` (or a bounded positive history). Omitting `fork_turns` or using `"all"` rejected full-history role/model/reasoning overrides in the tested runtime. The returned configured nickname is identity evidence; the task path alone is not. These V2 knobs are not presented as a stable public API.

## Mandate Quality (ZERO TOLERANCE)

Concision is for the user. Every non-trivial subagent brief must be self-contained and include:

1. **Objective** - one concrete outcome.
2. **Scope and ownership** - exact files or read-only area, explicit exclusions, and no overlapping write ownership.
3. **Verified context** - relevant paths, constraints, evidence, and decisions already established by the lead.
4. **Proof** - acceptance criteria and exact validation commands or observable evidence.
5. **Report** - changed files or findings, command results, risks, and blockers.

Material ambiguity is escalated to the lead instead of improvised. A re-dispatched mandate is verified on disk and never executed twice.

1. **Exclusive file ownership** - NEVER shared edits between teammates.
2. **Well-scoped tasks** - Apply the Mandate Quality contract above.
3. **Progress tracking mandatory** - Track pending/in-progress/completed work with the available Codex planning/checklist mechanism.
4. **Respect runtime capacity** - Never exceed the active concurrency limit; use only as many teammates as independent work justifies.
5. **80% planning, 20% execution** - Detailed specs produce better results.
6. **Propose team split for multi-file tasks** when parallelism is useful; spawn immediately when the user asks for team/parallel agents.
7. **Launch -> Orchestrate -> Monitor -> VERIFY** - spawning teammates is step 1, not the job. After EACH report, verify deliverables ON DISK (grep/diff expected changes).
8. **Idle is not done** - idle/available is not completion. No deliverable on disk -> take the mandate back or re-dispatch.
9. **Re-dispatch clause in every brief** - if already delivered, verify disk and refuse duplicate execution.
10. **Close completed subagents when exposed** - after a final status is reviewed and integrated, call `close_agent` when the runtime exposes it; otherwise do not claim that cleanup occurred.

## Anti-Patterns (FORBIDDEN)
- **2 teammates on same file** -> conflict/overwrite risk.
- **Assuming fixed tools** -> use the available Codex subagent workflow, CLI slash commands, or project tooling.
- **Skipping disk verification** -> agent output is a claim until checked.
- **Writing to deployed dir** -> always work in dev/source repo, then sync after validation.
- **Destructive action inside an agent brief** -> forbidden. Contestable deletion/overwrite/reset stays with the lead after user validation.
