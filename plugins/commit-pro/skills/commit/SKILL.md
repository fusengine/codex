---
name: commit
description: "Smart conventional commit with security validation, branch flow enforcement, and auto-detection. Use when committing changes, saving work, staging and committing, or choosing a conventional commit message."
---

# Smart Conventional Commit

## Preflight

Inspect the current state before acting:

```bash
git status
git diff --staged --stat
git log --oneline -5
git branch --show-current
```

## Instructions

Based on the context above, create a professional commit.

### Step 0: Branch Check (GitHub Flow enforcement)

Read current branch from above.

**If current branch is `main`, `master`, `develop`, or `production`:**

BLOCK direct commits and propose a feature branch:

```text
🌿 Branch Protection
───────────────────────────────
Current: <branch>
Issue: Direct commits to protected branches discouraged (GitHub Flow)
───────────────────────────────

Pre-detect commit type/scope from staged changes (Step 2 logic) to suggest branch name:
  - feat(seo) → feat/seo
  - fix(sniper) → fix/sniper
  - chore(deps) → chore/deps

Proposed branch: <type>/<scope-or-summary>

Options:
  Y → Create branch + continue commit
  N → Abort
  C → Custom branch name
```

If user accepts → execute `git checkout -b <branch>` then proceed to Step 1.
If user declines → STOP, do not commit.

**If current branch already a feature branch** (e.g. `feat/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`, `perf/*`, `test/*`, `ci/*`, `build/*`, `style/*`) → skip to Step 1 directly.

**Exceptions** (allow direct commit on main):
- Repo has only `main` branch and no remote (solo prototype)
- User explicitly requests `--no-branch-check`
- Commit type is `chore` AND scope is `release` or `version` (post-commit bump commits)

### Step 1: Security Check

BLOCK and output if secrets detected:

```text
🔒 Security Alert
───────────────────────────────
Found: [file or pattern]
Action: Commit blocked
Fix: Remove sensitive data before committing
```

Check for:
- `.env`, `.env.*` files
- Patterns: `password=`, `secret=`, `api_key=`, `token=`
- Files: `*.pem`, `*.key`, `*credentials*`

### Step 2: Analyze and Detect

Output analysis:

```text
📊 Analysis
───────────────────────────────
Files changed: [X]
Files staged: [Y]
Pattern detected: [type]
```

### Step 3: Generate Message

Format: `type(scope): imperative description`

**FORBIDDEN (NO AI SIGNATURE):**
- NEVER add "Co-authored-by: Codex" or any AI mention
- Commit must appear 100% human-written

### Step 4: Propose Commit

Output proposal:

```text
📝 Proposed Commit
───────────────────────────────
type(scope): description

[body if needed]
───────────────────────────────

⚡ Ready to commit? [Y/N/E]
```

### Step 5: Execute and Confirm

On confirmation, execute and output:

```text
✅ Committed successfully
───────────────────────────────
Hash: [short-hash]
Message: type(scope): description
Files: [X] changed
```

Execute with HEREDOC format:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description
EOF
)"
```

If the user provides commit context, use it as a hint for the message.

### Step 6: Post-Commit (universal)

After step 5 succeeds, execute the `post-commit` skill for CHANGELOG and version bump only. Tagging is delegated entirely to Step 8: post-merge push in FULL mode, local-only creation in LOCAL or DEGRADED mode.

This runs for ALL repos — the skill auto-detects the repo type internally.

### Step 7: Remote Flow (push + PR + CI + merge)

Run remote mutations only when the user explicitly authorized the corresponding scope:

- commit only → stop after Step 6;
- push or PR → push/create or reuse the PR, then leave it open;
- full release flow or explicit merge → run the FULL-mode merge sequence below.

Never infer push, PR, or merge authority from permission to commit.

#### Remote-flow decision tree

```bash
git remote -v
```

- **No remote → LOCAL mode.** Do not push, create a PR, or merge. For an explicitly requested release flow, use Step 8 LOCAL mode and print the commands needed after a remote is configured.
- **Remote exists → check GitHub CLI:**
  ```bash
  command -v gh
  gh auth status
  ```
  - `gh` missing or unauthenticated → **DEGRADED mode**. Push only when authorized, then stop and report the failed prerequisite plus the manual PR/merge commands. For an explicitly requested release flow, use Step 8 DEGRADED mode.
  - `gh` installed and authenticated → **FULL mode**.

After post-commit completes, if the current branch is a feature branch:

1. **Push branch with upstream**:
   ```bash
   git push -u origin <current-branch>
   ```
2. **Create the PR if absent; otherwise reuse it.** Pipe the body through stdin to avoid quoting bugs and temporary files:

   ```bash
   gh pr view --json url -q .url 2>/dev/null || gh pr create --base main --title "<commit subject>" --body-file - <<'EOF'
   ## Summary
   - <bullets from commit body>

   ## Changes
   <major changes>

   ## Test plan
   - [x] / [ ] as applicable

   ## Breaking changes
   None / <description>
   EOF
   ```

3. **If only push/PR was authorized**, output the PR URL and STOP.

When merge or full release flow was explicitly authorized, use a real merge commit, **never squash**. Prefer native auto-merge:

```bash
gh pr merge <pr> --auto --merge --delete-branch
```

`--auto` may only enable auto-merge. Before Step 8, require proof that the merge actually completed:

```bash
test -n "$(gh pr view <pr> --json mergedAt -q .mergedAt)" || { echo "merge pending; tag skipped"; exit 1; }
```

If auto-merge is unavailable, preserve the check command's exit status and merge only after success:

```bash
gh pr checks <pr> --watch && gh pr merge <pr> --merge --delete-branch
```

If the repository has no CI checks:

```bash
gh pr merge <pr> --merge --delete-branch
```

Never pipe `gh pr checks`; a pipeline can hide a failing exit status. After every merge path, require a non-empty `mergedAt` before Step 8. If checks fail, the merge remains pending, or branch protection rejects it, leave the PR open and do not tag.

**Skip Step 7 if**:
- User explicitly requests `--no-pr`
- User explicitly requests `--no-merge` for the merge portion
- Branch already merged

### Step 8: Release Tag

`vX.Y.Z` is the version bumped by `post-commit` in Step 6.

#### FULL mode

Run only after Step 7 confirms the PR actually merged:

```bash
git checkout main && git pull --ff-only
git fetch --prune
git tag vX.Y.Z
git push origin vX.Y.Z
git merge-base --is-ancestor vX.Y.Z main && echo "tag on main ok"
```

The real merge commit preserves the feature-branch commits, including the version bump. Waiting until the merge succeeds prevents publishing a tag for a commit rejected by CI or branch protection.

#### LOCAL or DEGRADED mode

For an explicitly requested release flow, create the tag locally after the Step 6 bump commit:

```bash
git tag vX.Y.Z
```

Never push that tag automatically. Print the manual push command for use only after the change reaches its permanent branch.

## Related skills

`commit-detection`, `git-flow`, `post-commit`.

## Skill routing metadata

related-skills: commit-detection, git-flow, post-commit
