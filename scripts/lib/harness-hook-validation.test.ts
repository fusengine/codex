import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateHarnessHookWiring } from "./harness-hook-validation";
import { canonicalHarnessCommand, HARNESS_VERSION } from "./harness-hook-policy";

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { force: true, recursive: true })));

function fixture(plugin: string, event: string, matcher: string, commands: string[]): string {
	const root = mkdtempSync(join(tmpdir(), "hook-wiring-"));
	roots.push(root);
	const dir = join(root, "plugins", plugin, "hooks");
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "hooks.json"), JSON.stringify({ hooks: {
		[event]: [{ matcher, hooks: commands.map((command) => ({ type: "command", command })) }],
	} }));
	return root;
}

test("accepts canonical routing and the real Harness-only snapshot", () => {
	const command = canonicalHarnessCommand("react-expert", "PreToolUse", "apply_patch")!;
	expect(validateHarnessHookWiring(fixture("react-expert", "PreToolUse", "apply_patch", [command]), {
		installedHarnessVersion: HARNESS_VERSION,
	})).toEqual([]);
	expect(validateHarnessHookWiring(join(import.meta.dir, "..", ".."))).toEqual([]);
});

test.each([
	"bun legacy.ts",
	'bun "${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs" hook codex',
	'bun "${CODEX_HOME}/node_modules/@fusengine/harness/dist/cli/bin.mjs" hook codex core',
	'bun "${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs" hook codex unknown',
	'bun "${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs" hook codex core || true',
])("rejects unaudited or non-canonical command: %s", (command) => {
	const errors = validateHarnessHookWiring(fixture("react-expert", "PreToolUse", "apply_patch", [command]), {
		installedHarnessVersion: HARNESS_VERSION,
	});
	expect(errors.length).toBeGreaterThan(0);
});

test("rejects duplicate handlers", () => {
	const command = canonicalHarnessCommand("react-expert", "PreToolUse", "apply_patch")!;
	const errors = validateHarnessHookWiring(
		fixture("react-expert", "PreToolUse", "apply_patch", [command, command]),
		{ installedHarnessVersion: HARNESS_VERSION },
	).join("\n");
	expect(errors).toContain("duplicate handler");
});

test("requires the audited installed Harness version", () => {
	const command = canonicalHarnessCommand("react-expert", "PreToolUse", "apply_patch")!;
	const errors = validateHarnessHookWiring(fixture("react-expert", "PreToolUse", "apply_patch", [command]), {
		installedHarnessVersion: "0.1.68",
	}).join("\n");
	expect(errors).toContain("re-audit");
});

test("prototype names do not resolve as routes", () => {
	expect(canonicalHarnessCommand("toString", "PreToolUse", "apply_patch")).toBeUndefined();
});
