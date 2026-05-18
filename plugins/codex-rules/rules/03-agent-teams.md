## Agent Teams

Use teams only when the current Codex runtime exposes a team/subagent capability
and the task benefits from parallel work. The lead may edit directly for scoped
work; it should coordinate when several agents are editing disjoint areas.

1. **Exclusive file ownership** - Never assign overlapping write scopes.
2. **Well-scoped tasks** - Each agent gets target files, expected output, and criteria.
3. **Bounded parallelism** - Keep teams small enough to review and integrate.
4. **Critical path stays local** - Do not delegate the immediate blocker when the lead can finish it safely.
5. **Final integration** - Review agent results and run validation after integration.

## Anti-Patterns (FORBIDDEN)
- **2 teammates on same file** -> conflict-prone.
- **Assuming fixed tools** -> use the available Codex interface (`spawn_agent`, CLI slash commands, or project tooling).
- **Delegating trivial work** -> slower and noisier than direct local edits.
- **Writing to deployed dir** -> work in the source repo, then sync after validation.
