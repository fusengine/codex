/**
 * hooks-trust-test-helpers.ts — shared fixtures for hooks-trust.test.ts and
 * hooks-trust-accept.test.ts. NOT named `*.test.ts` on purpose (see clack-prompts-mock.ts) so
 * bun's test glob never picks it up as an (empty) test file.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const MARKETPLACE = "fusengine-codex";

export function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-hooks-trust-"));
}

/** Seeds one cached plugin version with a two-event hooks.json (3 command handlers total). */
export function seedPluginCache(codexHome: string, plugin: string, version: string): void {
	const hooksDir = join(codexHome, "plugins", "cache", MARKETPLACE, plugin, version, "hooks");
	mkdirSync(hooksDir, { recursive: true });
	writeFileSync(
		join(hooksDir, "hooks.json"),
		JSON.stringify({
			hooks: {
				PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo pre" }] }],
				PostToolUse: [{ matcher: "*", hooks: [{ type: "command", command: "echo post-a" }, { type: "command", command: "echo post-b" }] }],
			},
		}),
	);
}

/** Runs `fn` under a simulated TTY (bun:test itself has none — see harness-env-tty.test.ts). */
export async function runUnderTTY(fn: (codexHome: string, marketplace: string) => Promise<void>, codexHome: string): Promise<void> {
	const originalIsTTY = process.stdin.isTTY;
	const originalCI = process.env.CI;
	process.stdin.isTTY = true;
	delete process.env.CI;
	try {
		await fn(codexHome, MARKETPLACE);
	} finally {
		process.stdin.isTTY = originalIsTTY;
		if (originalCI !== undefined) process.env.CI = originalCI;
	}
}
