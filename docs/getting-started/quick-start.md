# Quick Start

## How It Works

1. **Project Detection** - Codex detects your project type automatically
2. **Agent Selection** - Launches the matching expert agent
3. **Skills Loading** - Agent reads its framework skills + SOLID rules
4. **Research** - Consults Context7/Exa for documentation
5. **Code** - Writes code following best practices
6. **Validation** - Sniper validates (zero linter errors)

## Example Workflows

### New Feature (APEX)
```
User: "Add user authentication"

Codex:
1. Detects: Next.js project → nextjs-expert
2. Launches: explore-codebase + research-expert (parallel)
3. Plans: Implementation steps
4. Codes: With nextjs-expert
5. Validates: sniper checks
```

### Quick Fix
```
User: "Fix the typo in login.tsx"

Codex:
1. Skips APEX (trivial fix)
2. Fixes directly
3. Validates: sniper checks
```

### Commit
```
User: "commit"

Codex:
1. Runs /fuse-commit-pro:commit
2. Analyzes changes
3. Creates conventional commit
4. Updates CHANGELOG.md
```

## Key Commands

| Command | Description |
|---------|-------------|
| `/apex` | Full APEX workflow |
| `/apex-quick` | Quick APEX: Analyze -> Plan -> Execute/Answer -> Verify |
| `/commit` | Smart conventional commit |
| `/research` | Research with Context7/Exa |

## Tips

1. **Let Codex detect** - Don't specify agent, let it auto-detect
2. **Use APEX for every task** - Full for risky work, Quick for trivial/read-only
3. **Trust sniper** - It catches errors before you
