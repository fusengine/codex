/**
 * harness-env-options.ts — the fixed-preset harness toggle catalog + its pure helpers.
 * Split out of harness-env.ts (SRP: catalog/state helpers vs. the interactive prompt
 * orchestrator) to stay under the SOLID 90-line split threshold once the extra-knob
 * prompts (SOLID lines, debug, sound, tuning) were wired into promptHarnessEnv.
 */
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

export const HARNESS_ASKED_MARKER = "_FUSENGINE_HARNESS_ASKED";

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
