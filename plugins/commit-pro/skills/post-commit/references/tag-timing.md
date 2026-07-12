# Tag Timing Rationale

Load when deciding why post-commit steps do not push a release tag and how the commit workflow chooses the actual tagging point.

## Feature-branch bump commits

Do not push a tag while CI, branch protection, or PR merge can still reject or supersede the commit. A local tag is unpublished state; `git push origin vX.Y.Z` is the irreversible boundary and runs only after merge confirmation.

## Full mode

With a remote and authenticated GitHub CLI, the commit workflow merges with `gh pr merge --merge --delete-branch`, confirms the merge, then creates and pushes `vX.Y.Z`. Verify ancestry with `git merge-base --is-ancestor vX.Y.Z main`.

## Local or degraded mode

Without a remote or authenticated GitHub CLI, the workflow may create a local tag after the bump commit but must not push it automatically. Report the manual push command for use only after the change lands on its permanent branch.

## Standalone use

Outside the full commit workflow, tag only after the change is confirmed on its permanent branch.
