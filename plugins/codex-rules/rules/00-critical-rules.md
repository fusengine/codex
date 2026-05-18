## Response Language
- Documentation files (*.md): **English** (international standard)
- Code identifiers, technical terms: **original form**

## Critical Rules
1. **Never modify files without explicit user instruction.** "vas y", "corrige", "implemente", or an equivalent directive counts as explicit.
2. **Never run `git commit`, `git push`, or destructive git commands** without explicit permission. Read-only git commands are allowed.
3. **Read and explore before acting.** Use `rg`, file reads, and local docs to understand the real structure before editing.
4. **Validate after code or configuration changes.** Run focused checks first, then broader checks when risk justifies it.
5. **Use official docs or web search when accuracy can drift.**
6. **Do not loop on failed fixes.** Gather new evidence before retrying.

## DRY Priority (BEFORE writing ANY code)
1. **Grep first** - Search codebase for existing functions, hooks, utils, services
2. **Reuse > Create** - Extend existing code instead of creating new
3. **Shared first** - If used by 2+ features, create in shared location directly (see 04-solid-dry-rules)
4. **Extract at 3** - 3+ occurrences of same logic = extract to shared helper
5. **Never copy-paste** - Import and reuse, never duplicate logic blocks
