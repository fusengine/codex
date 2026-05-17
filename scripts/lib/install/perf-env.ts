/**
 * perf-env.ts — Codex CLI runtime env var toggles persisted in ~/.codex/.env.
 *
 * IMPORTANT — parity note vs claude-plugins:
 * Codex CLI 0.130.x has NO equivalent for Claude Code's perf vars
 *   CLAUDE_CODE_FORK_SUBAGENT, CLAUDE_CODE_ATTRIBUTION_HEADER,
 *   CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, DISABLE_AUTOUPDATER.
 * Verified by `strings $(which codex)` against codex-aarch64 0.130.0 — none of
 * these symbols exist. There is no telemetry-disable env var (telemetry is
 * controlled server-side / via account settings), and no autoupdater toggle.
 *
 * The toggles below are the ONLY documented + binary-verified env vars that
 * affect Codex CLI runtime behaviour:
 *   - RUST_LOG          : standard Rust log level (Codex is Rust-backed)
 *   - CODEX_TUI_ROUNDED : rounded TUI corners cosmetic toggle (binary-confirmed)
 *   - GIT_OPTIONAL_LOCKS: avoid git lock contention during long turns
 */
import * as p from "@clack/prompts";
import { loadEnvFile, saveEnvFile } from "./env-file";

export interface PerfEnvOption {
	key: string;
	label: string;
	hint: string;
	value: string;
}

export const PERF_ENV_OPTIONS: readonly PerfEnvOption[] = [
	{
		key: "RUST_LOG",
		label: "Quiet Rust core logs (error only)",
		hint: "Codex is Rust-backed — silences info/debug spam in long sessions",
		value: "error",
	},
	{
		key: "CODEX_TUI_ROUNDED",
		label: "Rounded TUI corners",
		hint: "Cosmetic — softer borders in the Codex TUI",
		value: "1",
	},
	{
		key: "GIT_OPTIONAL_LOCKS",
		label: "Disable optional git locks",
		hint: "Avoids git lock contention in `git status` calls during long turns",
		value: "0",
	},
] as const;

const PERF_ASKED_MARKER = "_FUSENGINE_PERF_ASKED";

/** @returns keys of perf options currently enabled in ~/.codex/.env */
export function getEnabledPerfEnv(env: Record<string, string>): string[] {
	return PERF_ENV_OPTIONS.filter((o) => env[o.key] === o.value).map((o) => o.key);
}

/** @returns true if perf prompt already answered (skip on re-install) */
export function isPerfEnvAsked(env: Record<string, string>): boolean {
	return env[PERF_ASKED_MARKER] === "1";
}

/** Apply selection: set chosen keys, drop unselected ones, mark asked. */
export function configurePerfEnv(
	env: Record<string, string>,
	selectedKeys: readonly string[],
): Record<string, string> {
	const next = { ...env };
	for (const opt of PERF_ENV_OPTIONS) {
		if (selectedKeys.includes(opt.key)) next[opt.key] = opt.value;
		else delete next[opt.key];
	}
	next[PERF_ASKED_MARKER] = "1";
	return next;
}

/** Interactive prompt for Codex env toggles. Writes ~/.codex/.env (chmod 600). */
export async function promptPerfEnv(codexHome: string): Promise<void> {
	const env = loadEnvFile(codexHome);
	if (isPerfEnvAsked(env)) {
		p.log.info("Perf env already configured — delete _FUSENGINE_PERF_ASKED in ~/.codex/.env to re-prompt");
		return;
	}
	p.log.info("Note: Codex CLI exposes no telemetry/autoupdate toggle (unlike Claude Code) — only RUST_LOG + cosmetic flags available");
	const wants = await p.confirm({
		message: "Configure Codex runtime env toggles? (~/.codex/.env)",
		initialValue: true,
	});
	if (p.isCancel(wants) || !wants) return;

	const choices = await p.multiselect({
		message: "Select toggles to enable:",
		options: PERF_ENV_OPTIONS.map((o) => ({ value: o.key, label: o.label, hint: o.hint })),
		initialValues: getEnabledPerfEnv(env),
		required: false,
	});
	if (p.isCancel(choices)) return;

	const keys = choices as string[];
	saveEnvFile(codexHome, configurePerfEnv(env, keys));
	p.log.success(`Codex env configured (${keys.length} toggles) → ~/.codex/.env`);
}
