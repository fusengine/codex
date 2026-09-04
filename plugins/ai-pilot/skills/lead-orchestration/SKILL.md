---
name: lead-orchestration
description: "Coordinate lead delegation safely. Use before any lead delegation, subagent, or team action, and for agent selection, folder ownership, mtime preflight, parallel work, mandate construction, agent lifecycle, stopping, relaunching, or convergence decisions."
---

# Lead Orchestration

Coordinate executors without overlapping ownership, stale writers, redundant permission prompts, or unverified handoffs. This skill governs the lead; a spawned executor performs its bounded mandate directly and does not create another delegation tree unless explicitly assigned that responsibility.

## 1. Apply authority and precedence

1. Follow `AGENTS.md` over this skill whenever they conflict. Never use delegation to expand the user's authority.
2. Treat a clear request to improve, optimize, refactor, fix, build, implement, or otherwise change something as authorization for reversible work inside that scope. Do not ask for redundant permission.
3. Ask only before an irreversible action or a material scope expansion. State reversible assumptions and continue.
4. **ALWAYS DELEGATE:** the lead orchestrates and never executes task work. Assign at least one executor for every modification.

## 2. Delegate the full APEX workflow every time

- Every task runs the routed APEX workflow in full; there is no scope ladder and no "too small to delegate" case.
- Analyze always starts the trio in one parallel message: `explore-codebase` for code analysis, `research-expert` for web or documentation research, and the matching domain expert.
- A research or exploration agent whose final report is empty or truncated is relaunched immediately with the same brief; an empty report is never accepted as "nothing found" (Terra tier, codex#32389).
- Any code change is executed by at least three domain experts matching the project stack, on disjoint file lots — the same specialty runs as separate instances when the stack yields only one matching expert type; never fill the remaining slots with a generic agent. They communicate with each other by message, and each receives a self-contained brief with a generated PRD of tasks.
- The coordinator alone writes two PRD layers before spawning. The router `<project>/.codex/apex/prd.json` holds one key per task pointing at its task PRD: `{ "task-1": { "prd": "prd/task-1-prd.json", "status": "assigned" } }`. For each task, the coordinator alone writes the task PRD `<project>/.codex/apex/prd/<task>-prd.json`: one sub-key per assigned agent (never a single agent per task) holding its target files and its sub-tasks, each sub-task's status set by the coordinator, `assigned` moving to `validated` only after the coordinator checks every task against the disk.
- Each agent reports only in its own file `<project>/.codex/apex/prd/agents/<agent>-prd.json`, keyed by task name, then by the sub-task keys the task PRD assigns to that agent, and ticks each finished sub-task `done` with the files it modified and the files left unchanged; it never writes `prd.json`, a task PRD, or another agent's report file, so no write can overwrite another.
- The coordinator reads every agent report, checks every task against the disk, marks each verified sub-task `validated` in the task PRD, and rolls the task's status up into the router. Every agent may read the router, every task PRD, and every agent report at any time to know exactly what is done, in progress, or untouched — that shared read is the collaboration channel alongside messages; only the owner of each file writes it. As a task closes, the coordinator compacts its task PRD: each validated agent's entry collapses to one line (agent, files, validated-at) — never merging multiple agents of the same task into a single line — and collapses the router's line for that task, so every file stays small and every later reader sees the current state without the history.
- When a change touches fewer files than experts, split the work by concern (implementation, tests, verification or docs) so every expert still owns a disjoint lot; exclusive ownership (§3) always prevails, and two writers on one file are never allowed.
- Every executor is told in its brief that its deliverable is challenged by the challenger and validated by sniper before acceptance; a self-declared "done" is never accepted.
- Use parallel agents only for independent batches with disjoint ownership. Do not parallelize dependent work.
- A team is for genuinely independent batches. When the user explicitly asks for a team, start one immediately; a team means at least four agents when capacity permits.
- Select the matching domain expert whenever one exists. Never substitute a generic agent for an available domain expert.

<example>
prd.json: { "task-1": { "prd": "prd/task-1-prd.json", "status": "in-progress" } }
prd/task-1-prd.json (before validation): { "agent-1": { "files": ["src/a.ts"], "sub-tasks": { "sub-1": { "status": "assigned" } } }, "agent-2": { "files": ["src/b.ts"], "sub-tasks": { "sub-2": { "status": "assigned" } } } }
prd/agents/agent-1-prd.json: { "task-1": { "sub-1": { "status": "done", "modified": ["src/a.ts"], "unchanged": [] } } }
prd/agents/agent-2-prd.json: { "task-1": { "sub-2": { "status": "done", "modified": ["src/b.ts"], "unchanged": [] } } }
prd/task-1-prd.json (after validation, compacted): { "agent-1": { "status": "validated", "files": ["src/a.ts"], "validated-at": "2026-09-02T14:10:00Z" }, "agent-2": { "status": "validated", "files": ["src/b.ts"], "validated-at": "2026-09-02T14:12:00Z" } }
</example>

## 3. Establish exclusive ownership

Before assigning any folder:

1. Run `date` and `ls -lT <target>` to compare current time with target mtimes.
2. Enforce one folder = one owner and give parallel agents disjoint file lots.
3. Treat an mtime less than five minutes old as busy; assign nobody else there.
4. Treat five to ten minutes as indeterminate; identify the current owner and recheck instead of creating a collision.
5. Treat more than ten minutes without a fresh mtime as stale, not busy: interrupt it with `interrupt_agent` or TaskStop, confirm mtimes have stopped changing, then relaunch with a fresh mandate.
6. Never infer completion from an mtime; verify the named deliverable on disk.

## 4. Use the delegation tool contract

- When multi-agent V2 is applicable, require `[features.multi_agent_v2]`, its configured `tool_namespace`, an exact `agent_type`, and bounded `fork_turns`. Never omit `fork_turns` or use `"all"` with `agent_type`.
- Treat the returned nickname as identity evidence. A task path alone is insufficient to establish agent identity.
- Agents discover each other with `list_agents` and can message any agent, sibling or parent, with `send_message` targeted by agent path or name (the lead is `/root`). A message only enters the receiver's mailbox; it never stops or waits for it.

## 5. Write a self-contained mandate

Put the owner-corrections block first. Copy every owner correction verbatim into every current and future mandate, including respawns.

Include:

- objective and verified context;
- exclusive files or folders and explicit non-ownership boundaries;
- instruction to start from current on-disk state, preserve unrelated edits, and never revert another contributor;
- acceptance criteria and forbidden actions;
- exact proof commands;
- expected report: changed files, evidence, failures, residual risks, and one Exit Contract outcome.

<example>
OWNER CORRECTIONS (verbatim):
- "<exact correction>"

Objective: <bounded result>
Exclusive ownership: <paths>
Do not touch: <paths or systems>
Acceptance: <observable criteria>
Proof: <commands or artifact checks>
Report: <files, results, risks, Exit Contract outcome>
</example>

## 6. Manage active agents

- A message does not stop an agent; it only enters its mailbox. Use `interrupt_agent` or TaskStop, then confirm target mtimes are stable before treating the writer as stopped.
- Never assign a second writer to an owned folder. If a collision occurs, name one owner and instruct it to continue from the current on-disk state while preserving both contributions.
- Verify the artifact on disk after every report. A report or idle notification is not proof of delivery.
- Do not run final validation while writers are active. A delta sent after spawn is unapplied until the writer explicitly confirms it was integrated.
- Never report "still waiting" twice. On the next turn, make a decision: verify, interrupt and relaunch, reroute, or escalate.
- After two failed delegations on a localized, measured defect, reroute to another qualified executor with a new hypothesis or escalate. The lead still does not edit it.

## 7. Converge before validation

1. Wait for every writer to report and explicitly confirm that all queued deltas are integrated.
2. Verify each deliverable on disk against its named acceptance criteria.
3. Stop or close every writer before the final sniper pass, then confirm relevant mtimes remain stable.
4. Run no validation mid-flight. Hand off to the eLicit, Verify, challenge, and code-quality routes required by `AGENTS.md` only after execution is frozen.

## Exit Contract

End every loop with exactly one outcome:

- **Stop:** the named result is verified with artifact and command evidence.
- **Retry:** use a different documented hypothesis; never repeat the same failed fix.
- **Rollback:** have the owning executor safely restore only its changes to the last green state without destructive reset or damage to unrelated work; escalate if ownership overlaps.
- **Ask:** reserve for an irreversible action or material scope expansion, never for a clear reversible mandate.
- **Escalate:** report the root cause, attempts, evidence, and unresolved risk when safe progress is exhausted.

Never reopen a settled instruction as Ask. Never produce two consecutive Ask outcomes without a deliverable between them. The attempt cap belongs to the sniper Fix Retry Loop; do not invent or redefine one in this skill.

## Forbidden

- Never let the lead execute task work after a delegated failure.
- Never overlap folder ownership or validate a moving worktree.
- Never treat a mailbox message, idle state, recent mtime, or agent assertion as proof.
- Never omit owner corrections from a respawn or future mandate.
- Never ask again for permission already supplied by a clear mandate.
