---
name: commit
description: "Smart conventional commit with security validation, branch flow enforcement, and auto-detection. Use when committing changes, saving work, staging and committing, or choosing a conventional commit message."
related-skills: commit-detection, git-flow, post-commit
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
- User explicitly passes `--no-branch-check` in `$ARGUMENTS`
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

If $ARGUMENTS provided, use as hint for the message.

### Step 6: Post-Commit (universal)

After step 5 succeeds, execute the `post-commit` skill (CHANGELOG + version bump only; no tag here unless a later post-merge step actually runs).

This runs for ALL repos — the skill auto-detects the repo type internally.

### Step 7: Push Branch + Pull Request (GitHub Flow)

Only run this step when the user explicitly asked for push, PR creation, or release flow.

After post-commit completes, if current branch is a feature branch (not main/master) and a remote is configured:

1. **Push branch with upstream**:
   ```bash
   git push -u origin <current-branch>
   ```
2. **Check if PR already exists**:
   ```bash
   gh pr view --json url 2>/dev/null
   ```
   - If exists → output URL, STOP.
   - If not → propose creating one.

3. **Propose PR creation**:

   ```text
   🔀 Pull Request
   ───────────────────────────────
   Branch: <feature-branch>
   Base: main
   ───────────────────────────────

   Create PR via gh? [Y/N]
   ```

4. **If accepted**, generate PR with this template:

   ```bash
   gh pr create --title "<commit subject>" --body "$(cat <<'EOF'
   ## Summary
   - <bullet 1 from commit body>
   - <bullet 2>

   ## Changes
   <list of major changes>

   ## Test plan
   - [ ] Manual test on X
   - [ ] CI passes
   - [ ] Sniper validation clean

   ## Breaking changes
   None / <description>
   EOF
   )"
   ```

5. **Output PR URL** and STOP unless the user explicitly requested merge.

If the user explicitly requested merge, prefer squash merge after required checks pass:

```bash
gh pr checks <pr> --watch && gh pr merge <pr> --squash --delete-branch
```

If merge succeeds, proceed to Step 8.

**Skip Step 7 if**:
- No remote configured
- User passes `--no-pr` in `$ARGUMENTS`
- Branch already merged
- Repo has no `gh` CLI installed (graceful degradation, output manual command)

### Step 8: Post-Merge Tag (main only, after a successful squash merge)

Only runs after Step 7 actually merged the PR.

```bash
git checkout main && git pull --ff-only
git fetch --prune
git tag vX.Y.Z
git push origin vX.Y.Z
git merge-base --is-ancestor vX.Y.Z main && echo "tag on main ok"
```

`vX.Y.Z` is the version bumped by `post-commit` in Step 6.

Why the tag moves here: `gh pr merge --squash` creates a brand-new commit on `main`; feature-branch commits do not land on `main`. Tagging the actual squash-merge commit keeps the tag meaningful.
