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
