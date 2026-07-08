---
name: post-commit
description: "Universal post-commit actions. CHANGELOG update for all repos; git tag is created post-merge by the commit skill. Plugin version bumping for marketplace repos. Triggered after any code commit except wip, amend, or undo."
related-skills: commit, git-flow
---


# Post-Commit Skill

Universal post-commit actions after a successful code commit.

## Step 1: Read Last Commit

```bash
git log --format='%s' -1
```

Save the commit message for CHANGELOG entry.

## Step 2: Detect Repo Type

Check if `.agents/plugins/marketplace.json` exists in the repo root.

- **EXISTS** → Follow **Marketplace Path** (Steps M1–M5)
- **DOES NOT EXIST** → Follow **Standard Path** (Steps S1–S2)

---

## Standard Path (any repo without marketplace.json)

### Step S1: Update CHANGELOG

Read the latest git tag to determine current version:

```bash
git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"
```

Increment PATCH: `X.Y.Z` → `X.Y.(Z+1)`.

If `CHANGELOG.md` does not exist, create it with `# Changelog` heading.

Add a new entry at the top (after the `# Changelog` heading):

```markdown
## [X.Y.Z] - DD-MM-YYYY

- commit message from Step 1
```

### Step S2: Commit CHANGELOG

```bash
git add CHANGELOG.md
git commit -m "$(cat <<'EOF'
chore: update CHANGELOG to X.Y.Z
EOF
)"
```

STOP. Output summary. Do not tag here; tags are created after a successful squash merge by the `commit` skill Step 8.

---

## Marketplace Path (repo with .agents/plugins/marketplace.json)

### Step M1: Detect Modified Plugins

```bash
git diff --name-only HEAD~1 | grep '^plugins/' | cut -d/ -f2 | sort -u
```

If no plugins modified → Skip to Step M3 (still bump suite version).

Skip directories without `.codex-plugin/plugin.json`.

### Step M2: Bump Plugin Versions

For each modified plugin detected in Step M1:

1. Read `plugins/{name}/.codex-plugin/plugin.json`
2. Increment PATCH version: `X.Y.Z` → `X.Y.(Z+1)`
3. Write the new version back to `plugin.json`

Then determine plugin type from `marketplace.json`:

- **In `plugins[]` array** → Also update matching `version` field in `marketplace.json`
- **In `core[]` array** → Only bump `plugin.json` (core entries have no version field)

### Step M3: Bump Suite Version

Read top-level `version` from `.agents/plugins/marketplace.json`.

Increment PATCH: `X.Y.Z` → `X.Y.(Z+1)`.

Write the new suite version back to `.agents/plugins/marketplace.json` → `version`.

If `README.md` contains a shields.io version badge, update it to match the new version:

Replace `version-vOLD_VERSION-` with `version-vNEW_VERSION-` in the badge URL.

### Step M4: Update CHANGELOG

Add a new entry at the top of `CHANGELOG.md` (after the `# Changelog` heading):

```markdown
## [X.Y.Z] - DD-MM-YYYY

- type(plugin-name): description from the code commit message
```

Where `X.Y.Z` is the new suite version from Step M3.

Include `(plugin-name X.Y.Z)` in each line for bumped plugins.

### Step M5: Commit the Bump

Stage all modified files:

```bash
git add CHANGELOG.md README.md .agents/plugins/marketplace.json plugins/*/.codex-plugin/plugin.json docs/
```

Commit with HEREDOC format:

```bash
git commit -m "$(cat <<'EOF'
chore: bump marketplace and CHANGELOG to X.Y.Z
EOF
)"
```

This MUST be a separate commit from the code changes. Never combine.

Do not tag here; tags are created post-merge by the `commit` skill Step 8.

---

## Version Bump Rules

- ALL commit types trigger **PATCH** bump only
- MINOR/MAJOR bumps are **manual user decisions**, never automatic
- The bump commit is always SEPARATE from code changes

## CHANGELOG Type Mapping

| Commit Type | CHANGELOG Prefix |
|-------------|-----------------|
| `feat` | Added |
| `fix` | Fixed |
| `refactor` | Changed |
| `docs` | Documentation |
| `perf` | Performance |
| `test` | Tests |
| `chore` | Maintenance |
| `style` | Style |
| `ci` | CI/CD |
| `build` | Build |
