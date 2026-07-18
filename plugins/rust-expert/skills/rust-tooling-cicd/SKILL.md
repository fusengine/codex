---
name: rust-tooling-cicd
description: "Use when structuring a Cargo workspace, wiring features, or building a Rust CI pipeline — fmt, clippy, cargo-deny, cargo-audit, nextest, doc-tests, coverage, MSRV. Covers the canonical CI gate order and supply-chain checks. Do NOT use for writing the tests themselves (use rust-testing-quality) or non-Rust CI."
---

# Rust Tooling & CI/CD

## Agent Workflow (MANDATORY)

Before ANY tooling/CI work, use `spawn_agent` to run these agents in parallel:

1. **explore-codebase** - Inspect existing `Cargo.toml`, workspace layout, `.github/workflows`
2. **research-expert** - Verify current cargo / cargo-deny / nextest docs via Context7/Exa
3. **mcp__context7__query-docs** - Check workspace-inheritance and feature-unification specifics

After implementation, run **sniper** for validation.

---

## Overview

| Layer | Tool(s) | Purpose |
|-------|---------|---------|
| **Layout** | Cargo workspaces | One `Cargo.lock`, one `target/`, shared metadata |
| **Config** | features, `workspace.dependencies` | Optional functionality, single source of versions |
| **Format/lint** | `cargo fmt`, `cargo clippy` | Style + correctness lints, warnings as errors |
| **Supply chain** | `cargo deny`, `cargo audit` | Licenses, bans, duplicate/yanked/vulnerable crates |
| **Test** | `cargo nextest`, `cargo test --doc` | Fast parallel run + doc-tests |
| **Coverage/MSRV** | `cargo llvm-cov`, `cargo hack` | Line coverage, minimum-supported-Rust matrix |

---

## Critical Rules

1. **Gate order is fixed** - fmt → clippy → deny → audit → nextest → `test --doc` → coverage. Cheap, fast-failing checks run first.
2. **`-D warnings` on clippy in CI** - `cargo clippy --all-targets --all-features -- -D warnings`. A warning must fail the build.
3. **Commit `deny.toml`** - supply-chain policy is code; it must be reviewed and versioned.
4. **Centralize versions in `workspace.dependencies`** - members inherit with `dep.workspace = true`; never pin the same crate twice.
5. **`cargo test --doc` is a separate step** - nextest never runs doc-tests (see rust-testing-quality).

---

## Architecture

```
my-workspace/
├── Cargo.toml            # [workspace] members + workspace.dependencies + lints
├── Cargo.lock            # single lockfile, committed
├── deny.toml             # supply-chain policy, committed
├── crates/
│   ├── core/Cargo.toml   # inherits version.workspace = true
│   └── cli/Cargo.toml
└── .github/workflows/ci.yml
```

→ See [ci-workflow.md](references/templates/ci-workflow.md) and [deny-toml.md](references/templates/deny-toml.md)

---

## Reference Guide

### Concepts

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Workspaces & features** | [workspaces-features.md](references/workspaces-features.md) | Structuring members, inheriting deps, feature design, MSRV |
| **CI gate** | [ci-gate.md](references/ci-gate.md) | Ordering checks, cargo-deny/audit, coverage |

### Templates

| Template | When to Use |
|----------|-------------|
| [ci-workflow.md](references/templates/ci-workflow.md) | GitHub Actions pipeline |
| [deny-toml.md](references/templates/deny-toml.md) | Supply-chain policy + workspace root |

---

## Quick Reference

### The full local gate

```bash
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo deny check
cargo audit
cargo nextest run --all-features
cargo test --doc
cargo llvm-cov --all-features --workspace
```

### Workspace dependency inheritance

```toml
# root Cargo.toml
[workspace.dependencies]
serde = { version = "1", features = ["derive"] }

# member Cargo.toml
[dependencies]
serde = { workspace = true }
```

→ See [deny-toml.md](references/templates/deny-toml.md) for the complete root manifest

---

## Best Practices

### DO
- Fail fast: run `fmt` and `clippy` before the expensive test/coverage steps
- Keep one `[workspace.dependencies]` as the version source of truth
- Run `cargo hack --feature-powerset check` to catch broken feature combinations
- Run `cargo machete` to prune unused dependencies

### DON'T
- Let clippy warnings pass CI (use `-D warnings`)
- Duplicate crate versions across members instead of inheriting
- Skip `cargo deny` because "audit already ran" — they check different things
- Forget `cargo test --doc` after nextest
