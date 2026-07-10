const EVENTS = new Set([
	"PreToolUse", "PermissionRequest", "PostToolUse", "PreCompact", "PostCompact",
	"SessionStart", "UserPromptSubmit", "SubagentStart", "SubagentStop", "Stop",
]);
const ROOT_KEYS = new Set(["description", "hooks"]);
const GROUP_KEYS = new Set(["matcher", "hooks"]);
const HANDLER_KEYS = new Set([
	"type", "command", "commandWindows", "command_windows", "timeout", "async", "statusMessage",
]);
const UNSAFE_CODEX_HOME_RE = /\$\{CODEX_HOME\}|\$CODEX_HOME\b/;

function object(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknownKeys(value: Record<string, unknown>, allowed: Set<string>): string[] {
	return Object.keys(value).filter((key) => !allowed.has(key));
}

/** Validate the supported Codex hooks schema and runtime-safe home paths. */
export function validateHooksConfig(file: string, value: unknown): string[] {
	const errors: string[] = [];
	if (!object(value)) return [`${file}: root must be an object`];
	for (const key of unknownKeys(value, ROOT_KEYS)) errors.push(`${file}: unsupported root key '${key}'`);
	if (value.description !== undefined && typeof value.description !== "string") {
		errors.push(`${file}: description must be a string`);
	}
	if (!object(value.hooks)) return [...errors, `${file}: hooks must be an object`];

	for (const [event, groups] of Object.entries(value.hooks)) {
		if (!EVENTS.has(event)) errors.push(`${file}: unsupported event '${event}'`);
		if (!Array.isArray(groups)) {
			errors.push(`${file}: ${event} must be an array`);
			continue;
		}
		for (const [groupIndex, group] of groups.entries()) {
			const groupPath = `${file}: ${event}[${groupIndex}]`;
			if (!object(group)) {
				errors.push(`${groupPath} must be an object`);
				continue;
			}
			for (const key of unknownKeys(group, GROUP_KEYS)) errors.push(`${groupPath}: unsupported key '${key}'`);
			if (!Array.isArray(group.hooks)) {
				errors.push(`${groupPath}.hooks must be an array`);
				continue;
			}
			for (const [handlerIndex, handler] of group.hooks.entries()) {
				const handlerPath = `${groupPath}.hooks[${handlerIndex}]`;
				if (!object(handler)) {
					errors.push(`${handlerPath} must be an object`);
					continue;
				}
				for (const key of unknownKeys(handler, HANDLER_KEYS)) errors.push(`${handlerPath}: unsupported key '${key}'`);
				if (handler.type !== "command" || typeof handler.command !== "string") {
					errors.push(`${handlerPath} must define a command hook`);
				} else if (UNSAFE_CODEX_HOME_RE.test(handler.command)) {
					errors.push(`${handlerPath}: CODEX_HOME requires a $HOME/.codex fallback`);
				}
			}
		}
	}
	return errors;
}
