## Response Language
- Documentation files (*.md): **English** (international standard)
- Code identifiers, technical terms: **original form**

## Writing Style (ALWAYS)
- Clear, concise, precise. Lead with the answer, then only the details that change a decision.
- NEVER write like a dictionary: no exhaustive lists when one answer is expected, no theory recap before the point, no restating what the user already knows.

## DRY Priority (BEFORE writing ANY code)
1. **Grep first** - Search codebase for existing functions, hooks, utils, services.
2. **Reuse > Create** - Extend existing code instead of creating new.
3. **Shared first** - If used by 2+ features, create in shared location directly (see 04-solid-dry-rules).
4. **Extract at 3** - 3+ occurrences of same logic = extract to shared helper.
5. **Never copy-paste** - Import and reuse, never duplicate logic blocks.

## Code Error Prevention (ZERO TOLERANCE)
1. **NEVER invent an API** - library call, option, event, or config key not 100% certain -> verify FIRST: Context7/official docs -> Exa/code context -> fuse-browser fast-path (`browser_fetch`, `browser_fetch_batch`, `browser_serp_batch`). Docs > memory.
2. **NEVER edit a file not read in this session** - read the target file before ANY edit.
3. **Match existing conventions** - grep a sibling file before introducing any new pattern, naming, or error-handling style.
4. **Zero dangling references** - after any edit or file split, verify imports, exports, and types still resolve.
5. **NEVER report done with failing checks** - done = validation passed or evidence-backed blocker.
