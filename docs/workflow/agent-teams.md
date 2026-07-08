# Agent Teams

Use agent teams only when the active Codex runtime exposes a subagent/team
capability and the task benefits from parallel work.

## When To Use Agents

| Situation | Recommendation |
|-----------|----------------|
| Read-only lookup | Inspect locally and answer directly |
| Small scoped edit | Lead edits directly and validates |
| Broad codebase audit | Spawn explorers/researchers with bounded prompts |
| Multi-file implementation | Split by exclusive file ownership |
| User explicitly asks for a team | Use the available Codex subagent interface |

Do not assume fixed legacy team/task interfaces. Codex runtimes may expose app
`spawn_agent`, CLI slash commands, or project-specific orchestration tools.

## Delegation Rules

1. **Exclusive file ownership** - no two agents should edit the same file.
2. **Well-scoped tasks** - define target files, expected output, and validation.
3. **Small teams** - keep parallelism low enough to review and integrate.
4. **Critical path stays local** - do not delegate the immediate blocker when
   the lead can finish it safely.
5. **Final integration** - the lead reviews agent output and runs validation.
6. **Close completed subagents** - after final status is reviewed and integrated,
   close every spawned subagent no longer needed.

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Fixed tool assumptions | Not portable across Codex app, CLI, and API | Use available runtime tools |
| Shared file edits | Conflict-prone integration | Assign exclusive write scopes |
| Delegating trivial edits | Slower and noisier | Edit locally |
| Vague prompts | Agents guess and diverge | Specify files, output, and checks |
| Skipping integration review | Broken combined result | Review diffs and validate |

## Example

```
Goal: audit plugin hook compatibility.

Agent A:
- Scope: plugins/*/hooks/hooks.json
- Output: invalid events, matchers, missing scripts

Agent B:
- Scope: installer scripts
- Output: install/cache/config risks

Lead:
- Integrates findings
- Applies scoped fixes
- Runs validation
```
