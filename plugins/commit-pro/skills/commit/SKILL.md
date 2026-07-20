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

Before any write action, ask explicit user confirmation. This includes `git add`, `git commit`, tags, push, branch creation, reset, and revert.

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
- NEVER add any AI signature, Co-authored-by line, or generated-by mention
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

After step 5 succeeds, execute the `post-commit` skill (CHANGELOG + version bump only — **no tag here**, see Step 8 for why).

This runs for ALL repos — the skill auto-detects the repo type internally.

### Step 7: Optional Remote Flow (push + PR + CI watch + merge)

Run only the remote mutations explicitly authorized by the user. Permission to commit does not imply permission to push, create a PR, or merge.

Inspect the execution mode first:

```bash
git remote -v
command -v gh
gh auth status
```

- **LOCAL**: no remote. Do not push, create a PR, or merge. For an explicitly requested release flow, create only the local tag described in Step 8 and report the future manual commands.
- **DEGRADED**: a remote exists but `gh` is missing or unauthenticated. Push only when authorized, report the failed prerequisite, and do not create or merge a PR. For an explicitly requested release flow, use the local-only tag behavior from Step 8.
- **FULL**: remote exists and `gh` is authenticated. Continue below.

After post-commit completes, if the current branch is a feature branch:

1. **Push branch**:
   ```bash
   git push -u origin <current-branch>
   ```
2. **Create the PR if absent** (else reuse the existing one). Pipe the body through stdin to avoid quoting bugs and temporary files:
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
3. If only push/PR was authorized, output the PR URL and STOP.
4. **Surveillance + merge auto** — only when merge or full release flow was explicitly authorized. Use a real merge commit, **never squash**:
   - Prefer GitHub native auto-merge (merges once required checks pass):
     ```bash
     gh pr merge <pr> --auto --merge --delete-branch
     ```
     `--auto` may only enable auto-merge. Before Step 8, require proof that the merge completed:
     ```bash
     test -n "$(gh pr view <pr> --json mergedAt -q .mergedAt)" || { echo "merge pending; tag skipped"; exit 1; }
     ```
   - If auto-merge is not enabled, watch checks then merge. Never pipe `gh pr checks`; preserve its exit status:
     ```bash
     gh pr checks <pr> --watch && gh pr merge <pr> --merge --delete-branch
     ```
   - If the repo has **no CI checks**, merge immediately:
     ```bash
     gh pr merge <pr> --merge --delete-branch
     ```
5. After every merge path, require a non-empty `mergedAt`. Output the PR URL + merge status and proceed to **Step 8** only after that proof succeeds.

**Leave the PR OPEN (push + PR only, do NOT merge, skip Step 8) if**:
- User explicitly requests `--no-merge`
- CI checks **FAIL** → report the failing check, leave PR open for the user
- Branch protection rejects the merge → report, leave open

`--no-pr` skips PR creation. `--no-merge` leaves the PR open. Failed CI or rejected branch protection also leaves it open and forbids tagging.

### Step 8: Release Tag

`vX.Y.Z` is the version bumped by `post-commit` in Step 6.

#### FULL mode

Run only after Step 7 confirms the PR actually merged:

```bash
git checkout main && git pull --ff-only
git fetch --prune   # drop remote-tracking refs (origin/*) of branches already deleted on the remote
git tag vX.Y.Z
git push origin vX.Y.Z
git merge-base --is-ancestor vX.Y.Z main && echo "tag on main ok"
```

The real merge commit preserves the feature-branch commits, including the bump commit. Waiting until merge succeeds prevents publishing a tag for a commit rejected by CI or branch protection.

#### LOCAL or DEGRADED mode

For an explicitly requested release flow, create the tag locally after the Step 6 bump commit:

```bash
git tag vX.Y.Z
```

Never push that local tag automatically. Print the manual push command for use only after the change reaches its permanent branch.

## Related skills

`commit-detection`, `git-flow`, `post-commit`.

## Skill routing metadata

related-skills: commit-detection, git-flow, post-commit
