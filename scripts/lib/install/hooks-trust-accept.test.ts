/**
 * hooks-trust-accept.test.ts — split out of hooks-trust.test.ts (SOLID 90-line threshold):
 * accepting writes one `[hooks.state]` block per discovered command handler, preserving
 * unrelated config.toml content; a second accepted run replaces the block, never duplicates it.
 */
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, mock, test } from "bun:test";
import { clackPromptsMock } from "./clack-prompts-mock";
import { runUnderTTY, seedPluginCache, tmpCodexHome } from "./hooks-trust-test-helpers";

mock.module("@clack/prompts", () =>
	clackPromptsMock({
		confirm: mock(async () => true),
		isCancel: mock((value: unknown) => typeof value === "symbol"),
	}),
);

afterEach(() => mock.restore());

const { promptHooksTrust } = await import("./hooks-trust");

test("accepting writes one [hooks.state] block per discovered command handler, preserving prior content", async () => {
	const home = tmpCodexHome();
	seedPluginCache(home, "alpha", "1.0.0");
	writeFileSync(join(home, "config.toml"), 'model = "gpt-5.6"\n');
	await runUnderTTY(promptHooksTrust, home);
	const config = readFileSync(join(home, "config.toml"), "utf8");
	expect(config).toContain('model = "gpt-5.6"');
	expect(config).toContain('[hooks.state."alpha@fusengine-codex:hooks/hooks.json:pre_tool_use:0:0"]');
	expect(config).toContain('[hooks.state."alpha@fusengine-codex:hooks/hooks.json:post_tool_use:0:0"]');
	expect(config).toContain('[hooks.state."alpha@fusengine-codex:hooks/hooks.json:post_tool_use:0:1"]');
	expect(config.match(/trusted_hash = "sha256:[0-9a-f]{64}"/g)).toHaveLength(3);
	rmSync(home, { recursive: true, force: true });
});

test("a second accepted run replaces the block instead of duplicating it", async () => {
	const home = tmpCodexHome();
	seedPluginCache(home, "alpha", "1.0.0");
	await runUnderTTY(promptHooksTrust, home);
	await runUnderTTY(promptHooksTrust, home);
	const config = readFileSync(join(home, "config.toml"), "utf8");
	expect(config.match(/# >>> fusengine-codex hooks trust >>>/g)).toHaveLength(1);
	expect(config.match(/# <<< fusengine-codex hooks trust <<</g)).toHaveLength(1);
	expect(config.match(/trusted_hash = "sha256:[0-9a-f]{64}"/g)).toHaveLength(3);
	rmSync(home, { recursive: true, force: true });
});
