# Plugin Documentation Parity

Load when a commit adds a plugin and its documentation surface must be updated.

```bash
git diff --name-only HEAD~1 HEAD | grep -oE '^plugins/[^/]+' | sort -u
```

For each newly added plugin:

1. Create or update its page under `docs/plugins/`, following sibling naming and structure.
2. Add it to the matching README plugin table.
3. Update the documented Codex plugin installation list or example when that list exists.
4. Prove every reported agent, skill, hook, and version count from the filesystem.
