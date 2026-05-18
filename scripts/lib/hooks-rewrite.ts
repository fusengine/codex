/**
 * Codex → Codex hook event mapping.
 * Codex plugin hooks use stable events only: SessionStart, PreToolUse,
 * PostToolUse, UserPromptSubmit, PermissionRequest, Stop. PreCompact may
 * exist in internal schemas but is intentionally skipped for plugin hooks.
 * Sources: developers.openai.com/codex/hooks + issue openai/codex#21753
 */
export const EVENT_MAP: Record<string, string> = {
	SessionStart: "SessionStart",
	PreToolUse: "PreToolUse",
	PostToolUse: "PostToolUse",
	UserPromptSubmit: "UserPromptSubmit",
	PermissionRequest: "PermissionRequest",
	Stop: "Stop",
	SubagentStart: "SessionStart",
	SubagentStop: "Stop",
	SessionEnd: "Stop",
	TaskCompleted: "Stop",
	PostToolUseFailure: "PostToolUse",
	InstructionsLoaded: "SessionStart",
};

/**
 * Codex-specific events with NO Codex equivalent (skipped with warning).
 */
export const UNSUPPORTED_EVENTS = new Set(["TeammateIdle", "Notification", "PreCompact"]);

/**
 * Rewrite a Codex hook command string for the Bun-based Codex runtime.
 */
export function rewriteCommand(cmd: string): string {
	// Codex preserves PLUGIN_ROOT as compat alias for PLUGIN_ROOT
	// (developers.openai.com/codex/hooks). Leave the var as-is.
	let out = cmd.replace(/\bpython3\s+/g, "bun ");
	out = out.replace(/\.py(\b|$)/g, ".ts$1");
	return out;
}
