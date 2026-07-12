---
name: run-tasks
description: "Execute GitHub issues using full EPCT workflow (Explore-Plan-Code-Test). Converts issue requirements into completed PR. (migrated from Codex command workflow)"
---

# Run GitHub Issue Tasks

Execute GitHub issue with complete EPCT workflow:

1. **Fetch Issue Details**:
   ```bash
   gh issue view "$ISSUE_NUMBER"
   ```

   Extract:
   - Issue title and description
   - Acceptance criteria
   - Labels and priority
   - Related issues/PRs

2. **Execute EPCT**:
   Run `/epct [ISSUE_TITLE]` workflow:

   **EXPLORE**: Understand affected components
   **PLAN**: Design solution
   **CODE**: Implement changes
   **TEST**: Validate implementation

3. **Create Branch**:
   ```bash
   git checkout -b issue-$ISSUE_NUMBER-[slug]
   ```

4. **Commit Changes**:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: [ISSUE_TITLE]

   Fixes #$ISSUE_NUMBER

   - [Change 1]
   - [Change 2]


   EOF
   )"
   ```

5. **Create PR**:
   ```bash
   gh pr create --title "Fixes #$ISSUE_NUMBER: [TITLE]" --body "$(cat <<'EOF'
   ## Summary
   Resolves #$ISSUE_NUMBER

   ## Changes
   [List of changes]

   ## Test Plan
   [How tested]

   EOF
   )"
   ```

6. **Link Issue**:
   ```bash
   gh issue comment $ISSUE_NUMBER --body "PR created: [PR_URL]"
   ```

**Input**:
- Set `ISSUE_NUMBER` from the GitHub issue number explicitly provided by the user.

**Example Usage**:
- `/run-tasks 42` → Execute issue #42 with full workflow
