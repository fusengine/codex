import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generatedHookCommand } from "./hook-generation";
import { canonicalHarnessCommand } from "./harness-hook-policy";
import { transformHooks } from "./hooks";

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { force: true, recursive: true })));

function requiredCanonical(plugin: string, event: string, matcher: string): string {
	const command = canonicalHarnessCommand(plugin, event, matcher);
	if (!command) throw new Error(`Missing Harness route: ${plugin}/${event}/${matcher}`);
	return command;
}

test("canonicalizes every routed handler without preserving its source command", () => {
	expect(generatedHookCommand("ai-pilot", "PreToolUse", "apply_patch")).toBe(
		requiredCanonical("ai-pilot", "PreToolUse", "apply_patch"),
	);
});

test("refuses an unrouted handler instead of generating a direct command", () => {
	expect(generatedHookCommand("design-expert", "Stop", "not-routed")).toBeUndefined();
});

test("transforms a routed direct script into the canonical Harness command", async () => {
	const root = mkdtempSync(join(tmpdir(), "hook-transform-"));
	roots.push(root);
	const src = join(root, "ai-pilot");
	const dest = join(root, "out");
	mkdirSync(join(src, "hooks"), { recursive: true });
	writeFileSync(join(src, "hooks", "hooks.json"), JSON.stringify({ hooks: {
		PreToolUse: [{ matcher: "apply_patch", hooks: [{ type: "command", command: "bun scripts/legacy.ts" }] }],
	} }));
	await transformHooks(src, dest);
	const raw = readFileSync(join(dest, "hooks", "hooks.json"), "utf8");
	const output = JSON.parse(raw) as { hooks: { PreToolUse: Array<{ hooks: Array<{ command: string }> }> } };
	expect(output.hooks.PreToolUse[0]?.hooks[0]?.command).toBe(
		requiredCanonical("ai-pilot", "PreToolUse", "apply_patch"),
	);
	expect(raw).not.toContain("legacy.ts");
});

test("prompt hooks are skipped instead of generating a direct APEX command", async () => {
	const root = mkdtempSync(join(tmpdir(), "hook-transform-"));
	roots.push(root);
	const src = join(root, "ai-pilot");
	const dest = join(root, "out");
	mkdirSync(join(src, "hooks"), { recursive: true });
	writeFileSync(join(src, "hooks", "hooks.json"), JSON.stringify({ hooks: {
		Stop: [{ matcher: "", hooks: [{ type: "prompt", prompt: "Validate APEX workflow" }] }],
	} }));
	const result = await transformHooks(src, dest);
	const output = readFileSync(join(dest, "hooks", "hooks.json"), "utf8");
	expect(result.warnings.join("\n")).toContain("type='prompt' skipped");
	expect(output).not.toContain("validate-apex-workflow");
});
