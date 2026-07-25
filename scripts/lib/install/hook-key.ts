/**
 * hook-key.ts — persisted `[hooks.state."<key>"]` key construction, matching hooks/src/lib.rs
 * (`hook_key`, `hook_event_key_label`) and hooks/src/declarations.rs (`plugin_hook_key_source`).
 * Split out of hook-hash.ts to stay under the SOLID line budget.
 */
const EVENT_LABELS: Record<string, string> = {
	PreToolUse: "pre_tool_use",
	PermissionRequest: "permission_request",
	PostToolUse: "post_tool_use",
	PreCompact: "pre_compact",
	PostCompact: "post_compact",
	SessionStart: "session_start",
	SessionEnd: "session_end",
	UserPromptSubmit: "user_prompt_submit",
	SubagentStart: "subagent_start",
	SubagentStop: "subagent_stop",
	Stop: "stop",
};

/** Maps a PascalCase Codex hook event name to its snake_case persisted-key label. */
export function hookEventKeyLabel(eventName: string): string {
	const label = EVENT_LABELS[eventName];
	if (!label) throw new Error(`Unknown hook event: ${eventName}`);
	return label;
}

/** Builds the persisted `[hooks.state."<key>"]` key for one discovered handler. */
export function hookKey(keySource: string, eventName: string, groupIndex: number, handlerIndex: number): string {
	return `${keySource}:${hookEventKeyLabel(eventName)}:${groupIndex}:${handlerIndex}`;
}

/** Builds a plugin hook's `key_source` (`"<pluginId>:<sourceRelativePath>"`). */
export function pluginHookKeySource(pluginId: string, sourceRelativePath: string): string {
	return `${pluginId}:${sourceRelativePath}`;
}
