## Agent Teams

**Lead = Coordinator ONLY.** Never codes, only orchestrates.

1. **Exclusive file ownership** - NEVER shared edits between teammates
2. **Well-scoped tasks** - Each update_plan: target files, expected output, criteria
3. **update_plan mandatory** - Mark `completed` before idle
4. **Keep concurrent writers around 4 per phase** - the Analyze trio and the ≥3 execute experts run in separate phases and are never capped by this line; beyond ~4 simultaneous writers = coordination overhead, so sequence extra lots rather than dropping experts
5. **80% planning, 20% execution** - Detailed specs = better results
6. **ALWAYS propose spawning a team** (`spawn_agent`) for multi-file tasks — ask user before deciding
7. **Launch → Orchestrate → Monitor → VERIFY** - spawning teammates is step 1, not the job: after EACH teammate report, verify the deliverables ON DISK (grep/diff the expected changes) before considering the mandate done
8. **Idle ≠ done** - an idle/available notification is NOT a completion; no deliverable on disk → take the mandate back or re-delegate, never assume
9. **Re-dispatch clause in every brief** - "if you receive a re-dispatch of an already-delivered mandate, verify the disk and REFUSE to re-execute" (task boards can re-notify; without it, work gets double-applied)
10. **sniper AFTER all teammates finish** - never during; run it once, after every teammate's deliverable is verified on disk
11. **A research or exploration agent whose final report is empty or truncated is relaunched immediately with the same brief** - an empty report is never accepted as "nothing found" (Terra tier, codex#32389)

## Delegation Shape — always full trio+, never a smaller substitute

Every code change gets the full Analyze trio and ≥3 domain experts on disjoint file lots (AGENTS.md l.17,47; `$ai-pilot:lead-orchestration` #2) — there is no smaller path and no reflex shortcut. This table shows HOW the mandatory trio/team split applies to each shape of work, not WHETHER it applies.

| Shape | Action | Why |
|-------|--------|-----|
| 1 file or a few coupled files, same domain | Full Analyze trio (explore-codebase + research-expert + domain-expert) executes the change; split by concern (impl/tests/docs) across ≥3 experts if needed so ownership stays disjoint. | Doctrine mandates ≥3 experts on every change — coupling forbids two writers on the SAME file, not concurrent work on the same feature. |
| Multi-file (3+), same domain | ≥3 domain experts (same specialty runs as separate instances if needed), one owner per disjoint file lot, `send_message` to share the contract. | One executor per file-set is never allowed; the split is by exclusive ownership, not by file count. |
| Independent batches, multi-domain, or large multi-file with no cross-dependency | Team (`spawn_agent` x≥4), proposed to the owner first. | Parallelism only pays when batches have no dependency between them. |

**Key rule — the trigger is the INDEPENDENCE of the batches, never a file count or a single-executor shortcut.** Coupled files still get the full trio/≥3-expert split on disjoint lots; only genuinely independent batches escalate to a team (min 4, `spawn_agent`). When the owner says "team", it's a team, no debate.

## Anti-Patterns (FORBIDDEN)
- **Parallel Agent for multi-file edits** → spawn a team via `spawn_agent`, coordinate via `list_agents`/`send_message` (agents can't coordinate without messaging)
- **2 teammates on same file** → CONFLICT guaranteed (one overwrites the other)
- **Lead writing code** → Lead ORCHESTRATES only (update_plan + send_message)
- **Skipping the team-spawn proposal** (`spawn_agent`) → ALWAYS ask user: "Tu veux que je crée une team ?"
- **Writing to deployed dir** → ALWAYS work in dev repo, rsync after
- **Destructive action inside an agent brief** → FORBIDDEN. An in-flight agent cannot be reliably countermanded (messages are delivered between its turns — the original brief executes anyway). Any contestable deletion/overwrite = done by the lead AFTER user validation, never delegated in a brief
