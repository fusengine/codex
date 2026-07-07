#!/usr/bin/env bun
// @hook-entry
/**
 * inject-rules.native.ts — MUTED emitter.
 *
 * The codex-rules corpus (rules/*.md) is now merged into ~/.codex/AGENTS.md at
 * install time (scripts/lib/install/merge-agents-md.ts) and loaded NATIVELY
 * and SILENTLY by Codex on every session (codex-rs/core/src/agents_md.rs) —
 * no visible TUI card. Emitting `hookSpecificOutput.additionalContext` here
 * would ALWAYS print a visible card instead, which the owner rejected. This
 * hook therefore never emits additionalContext anymore, on SessionStart or
 * UserPromptSubmit; it stays wired in hooks.json as a harmless no-op so the
 * same command works unchanged across Claude Code, Cursor, and Hermes.
 */
process.stderr.write("rules: merged into AGENTS.md\n");
process.exit(0);
