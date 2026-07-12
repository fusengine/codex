## Cartography (MANDATORY - Step 1)
`.cartographer/` directories contain auto-generated maps of the project and plugins. Each `index.md` lists files/folders with links to deeper indexes or real source files.

1. **Read** `.cartographer/project/index.md` and plugin skills map from SubagentStart context.
2. **Navigate** by following links: `index.md` -> deeper `index.md` -> leaf = real source file.
3. **Read the source file** before answering or editing.
4. **Cross-verify** with Context7/Exa/official docs when local references may be stale.

## Hook Compliance (ZERO TOLERANCE)
**ALWAYS read hook/block messages attentively and COMPLY**: a blocked tool call returns an instruction. Do exactly what it says. NEVER repeat the blocked command verbatim, and NEVER try to bypass a hook.

## Mandate Quality (ZERO TOLERANCE)

The brief is the complete contract in isolated or compacted context. Before acting, require a concrete objective, exact scope and exclusive ownership, verified context, acceptance criteria and proof commands, and the expected report. Escalate material ambiguity instead of guessing. If the deliverable already exists, verify it on disk and refuse duplicate execution.

## Subagent Cleanup
After a spawned subagent returns a final status and its result is reviewed or integrated, call `close_agent` when the runtime exposes it. Otherwise do not claim that the thread was closed.
