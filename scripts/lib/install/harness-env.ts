/**
 * harness-env.ts — opt-in @fusengine/harness runtime toggles persisted in ~/.codex/.env.
 *
 * Codex HOOK processes inherit the environment of the `codex` process itself (no
 * env_clear in codex-rs hooks/command_runner.rs); `[shell_environment_policy]` applies
 * ONLY to the agent's shell tool, never to hooks (proven by source). So the ONLY way the
 * harness hook sees a var persistently is a shell-profile export — ~/.codex/.env, sourced
 * by the loader configureShellAutoLoad installs. Mirrors perf-env.ts, writes the same file.
 */
import * as p from "@clack/prompts";
import { loadEnvFile, saveEnvFile } from "./env-file";

export interface HarnessEnvOption {
	key: string;
	label: string;
	hint: string;
	value: string;
}

export const HARNESS_ENV_OPTIONS: readonly HarnessEnvOption[] = [
	{ key: "RALPH_MODE", label: "Ralph autonomous mode", hint: "Exempt SAFE git + project installs from guards (force-push/reset stay blocked). Off by default", value: "1" },
	{ key: "FUSE_DESIGN_GEMINI", label: "Gemini design gates", hint: "Enforce the Gemini Design MCP workflow for UI work. Off by default", value: "1" },
	{ key: "FUSE_ENFORCE_GEMINI_MCP", label: "Block hand-written UI without Gemini MCP", hint: "Block UI writes until a Gemini MCP call this session. Off by default", value: "1" },
	{ key: "FUSE_MCP_TTL_SEC", label: "MCP cache TTL", hint: "Cached-MCP freshness, seconds (harness default 48h). Edit the number in ~/.codex/.env to tune", value: "172800" },
	{ key: "FUSE_WEBFETCH_TTL_SEC", label: "WebFetch cache TTL", hint: "Cached-WebFetch freshness, seconds (harness default 24h). Edit to tune", value: "86400" },
	{ key: "FUSE_ENFORCE_TTL_SEC", label: "SOLID-read freshness window", hint: "APEX SOLID-read freshness, seconds (harness default 120s). Edit to tune", value: "120" },
] as const;

const HARNESS_ASKED_MARKER = "_FUSENGINE_HARNESS_ASKED";

/** @returns keys of harness toggles currently set to their preset value in ~/.codex/.env */
export function getEnabledHarnessEnv(env: Record<string, string>): string[] {
	return HARNESS_ENV_OPTIONS.filter((o) => env[o.key] === o.value).map((o) => o.key);
}

/** @returns true if the harness env prompt was already answered (skip on re-install) */
export function isHarnessEnvAsked(env: Record<string, string>): boolean {
	return env[HARNESS_ASKED_MARKER] === "1";
}

/** Apply selection: set chosen keys to their preset, drop unselected harness keys, mark asked. Foreign keys are preserved. */
export function configureHarnessEnv(env: Record<string, string>, selectedKeys: readonly string[]): Record<string, string> {
	const next = { ...env };
	for (const opt of HARNESS_ENV_OPTIONS) {
		if (selectedKeys.includes(opt.key)) next[opt.key] = opt.value;
		else delete next[opt.key];
	}
	next[HARNESS_ASKED_MARKER] = "1";
	return next;
}

/** Interactive prompt for harness toggles. Writes ~/.codex/.env (sourced into the shell → codex → hooks). */
export async function promptHarnessEnv(codexHome: string): Promise<void> {
	// @clack prompts HANG forever on non-TTY/CI stdin (no throw, no cancel) — guard first.
	if (!process.stdin.isTTY || process.env.CI) {
		p.log.info("Non-interactive run — skipping harness env prompt (set RALPH_MODE/FUSE_* in ~/.codex/.env manually)");
		return;
	}
	const env = loadEnvFile(codexHome);
	if (isHarnessEnvAsked(env)) {
		p.log.info("Harness env already configured — delete _FUSENGINE_HARNESS_ASKED in ~/.codex/.env to re-prompt");
		return;
	}
	const wants = await p.confirm({ message: "Configure @fusengine/harness runtime toggles? (~/.codex/.env)", initialValue: false });
	if (p.isCancel(wants) || !wants) return;
	const choices = await p.multiselect({
		message: "Select harness toggles (TTL values are editable in ~/.codex/.env):",
		options: HARNESS_ENV_OPTIONS.map((o) => ({ value: o.key, label: o.label, hint: o.hint })),
		initialValues: getEnabledHarnessEnv(env),
		required: false,
	});
	if (p.isCancel(choices)) return;
	const keys = choices as string[];
	saveEnvFile(codexHome, configureHarnessEnv(env, keys));
	p.log.success(`Harness env configured (${keys.length} toggles) → ~/.codex/.env`);
}
