/**
 * guard-patterns.ts — pattern data for git-guard and install-guard, ported
 * verbatim from git-guard.py / install-guard.py (and the standalone
 * git-guard-patterns.py / install-patterns.py data modules). Data only.
 */

/** Commands allowed without prompt while in Ralph mode (git-guard). */
export const RALPH_SAFE = [
  "git add", "git commit", "git checkout -b", "git branch --show-current",
  "git status", "git diff", "git log",
];

/** Destructive git command patterns → deny (regex sources, verbatim). */
export const BLOCKED_GIT = [
  "git push.*--force", "git push.*-f", "git reset.*--hard",
  "git clean.*-fd", "git branch.*-D", "git rebase.*--force",
];

/** Git command substrings that require confirmation → ask. */
export const ASK_GIT = [
  "git push", "git checkout", "git reset", "git rebase", "git merge",
  "git stash", "git clean", "git rm", "git mv", "git restore",
  "git revert", "git cherry-pick", "git commit", "git add",
  "git branch -d", "git branch -D",
];

/** System package install substrings → ask (install-guard). */
export const SYSTEM_INSTALL = [
  "brew install", "brew upgrade", "brew cask", "apt install", "apt-get install",
];

/** Project dependency install substrings → ask unless Ralph mode. */
export const PROJECT_INSTALL = [
  "npm install", "npm i ", "yarn add", "pnpm add", "pip install", "pip3 install",
  "composer require", "bun add", "bun install", "cargo install", "go install",
  "gem install", "pipx install",
];
