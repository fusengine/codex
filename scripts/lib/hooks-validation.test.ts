import { expect, test } from "bun:test";
import { validateHooksConfig } from "./hooks-validation";

test("accepts a valid hook with a CODEX_HOME fallback", () => {
	const config = { hooks: { SessionStart: [{ hooks: [{
		type: "command",
		command: 'bun "${CODEX_HOME:-$HOME/.codex}/node_modules/hook.js"',
	}] }] } };
	expect(validateHooksConfig("hooks.json", config)).toEqual([]);
});

test("rejects legacy metadata and unsafe braced CODEX_HOME paths", () => {
	const config = {
		_description: "legacy",
		hooks: { SessionStart: [{ _description: "legacy", hooks: [{
			type: "command",
			command: "bun ${CODEX_HOME}/node_modules/hook.js",
		}] }] },
	};
	const errors = validateHooksConfig("hooks.json", config).join("\n");
	expect(errors).toContain("_description");
	expect(errors).toContain("CODEX_HOME");
});

test("rejects unsafe unbraced CODEX_HOME paths", () => {
	const config = { hooks: { SessionStart: [{ hooks: [{
		type: "command",
		command: "bun $CODEX_HOME/node_modules/hook.js",
	}] }] } };
	expect(validateHooksConfig("hooks.json", config).join("\n")).toContain("CODEX_HOME");
});

test("accepts additionalContextLimit on context-producing events", () => {
	const config = { hooks: {
		SessionStart: [{ hooks: [{ type: "command", command: "bun a.js", additionalContextLimit: 6000 }] }],
		SubagentStart: [{ hooks: [{ type: "command", command: "bun b.js", additionalContextLimit: 6000 }] }],
		UserPromptSubmit: [{ hooks: [{ type: "command", command: "bun c.js", additionalContextLimit: 6000 }] }],
		PreToolUse: [{ hooks: [{ type: "command", command: "bun d.js", additionalContextLimit: 0 }] }],
	} };
	expect(validateHooksConfig("hooks.json", config)).toEqual([]);
});

test("rejects malformed or misplaced additionalContextLimit", () => {
	const config = { hooks: {
		SessionStart: [
			{ hooks: [{ type: "command", command: "bun a.js", additionalContextLimit: -1 }] },
			{ hooks: [{ type: "command", command: "bun b.js", additionalContextLimit: 1.5 }] },
			{ hooks: [{ type: "command", command: "bun c.js", additionalContextLimit: "6000" }] },
		],
		Stop: [{ hooks: [{ type: "command", command: "bun d.js", additionalContextLimit: 6000 }] }],
	} };
	const errors = validateHooksConfig("hooks.json", config).join("\n");
	expect(errors.match(/non-negative integer/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
	expect(errors).toContain("only supported on");
});
