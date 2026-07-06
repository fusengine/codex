/**
 * Codex → Codex hook event mapping.
 * Sources: developers.openai.com/codex/hooks.
 */
export const EVENT_MAP: Record<string, string> = {
	SessionStart: "SessionStart",
	SubagentStart: "SubagentStart",
	SubagentStop: "SubagentStop",
	PreToolUse: "PreToolUse",
	PostToolUse: "PostToolUse",
	PostCompact: "PostCompact",
	UserPromptSubmit: "UserPromptSubmit",
	PermissionRequest: "PermissionRequest",
	Stop: "Stop",
	SessionEnd: "Stop",
	TaskCompleted: "Stop",
	PostToolUseFailure: "PostToolUse",
	InstructionsLoaded: "SessionStart",
	Notification: "PermissionRequest",
	TeammateIdle: "SubagentStop",
};

/**
 * Codex-specific events with NO Codex equivalent (skipped with warning).
 */
export const UNSUPPORTED_EVENTS = new Set<string>(["PreCompact"]);

/**
 * Rewrite a Codex hook command string for the Bun-based Codex runtime.
 */
export function rewriteMatcher(matcher = ""): string {
	if (!matcher) return "";
	const parts = matcher.split("|").map((part) => {
		if (part === "Write" || part === "Edit") return "apply_patch";
		if (part === "Read" || part === "Grep" || part === "Glob") return "Bash";
		if (part === "WebFetch" || part === "WebSearch") return "mcp__.*";
		if (part === "Agent") return "spawn_agent|multi_agent_v1.spawn_agent";
		return part;
	});
	return [...new Set(parts)].join("|");
}

export function rewriteCommand(cmd: string): string {
	let out = cmd
		.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, "${PLUGIN_ROOT}")
		.replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, "${PLUGIN_DATA}")
		.replace(/\bCLAUDE_PLUGIN_ROOT\b/g, "PLUGIN_ROOT")
		.replace(/\bCLAUDE_PLUGIN_DATA\b/g, "PLUGIN_DATA")
		.replace(/\bCLAUDE_HOME\b/g, "CODEX_HOME")
		.replace(/\bpython3\s+/g, "bun ");
	out = out.replace(/\.py(\b|$)/g, ".ts$1");
	out = out.replace(/\bscripts\/session-start\/inject-claude-md\.ts\b/g, "scripts/session-start/inject-agents-md.ts");
	out = out.replace(/\bscripts\/user-prompt\/read-claude-md\.ts\b/g, "scripts/user-prompt/read-agents-md.ts");
	out = out.replace(/\bafplay\s+/g, "bun ${PLUGIN_ROOT}/scripts/sound/play.ts ");
	return out;
}
