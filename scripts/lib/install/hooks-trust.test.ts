/**
 * hooks-trust.test.ts — non-TTY never prompts; declining leaves config.toml untouched; no
 * cached plugin hooks never prompts either. The accept + re-run cases are split out into
 * hooks-trust-accept.test.ts (SOLID 90-line threshold).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, mock, test } from "bun:test";
import { clackPromptsMock } from "./clack-prompts-mock";
import { MARKETPLACE, runUnderTTY, seedPluginCache, tmpCodexHome } from "./hooks-trust-test-helpers";

const state = { confirmAnswer: false, confirmCalls: 0 };

mock.module("@clack/prompts", () =>
	clackPromptsMock({
		confirm: mock(async () => {
			state.confirmCalls++;
			return state.confirmAnswer;
		}),
		isCancel: mock((value: unknown) => typeof value === "symbol"),
	}),
);

afterEach(() => mock.restore());

const { promptHooksTrust } = await import("./hooks-trust");

test("non-TTY run never prompts and never touches config.toml", async () => {
	const home = tmpCodexHome();
	seedPluginCache(home, "alpha", "1.0.0");
	state.confirmAnswer = true;
	state.confirmCalls = 0;
	await promptHooksTrust(home, MARKETPLACE);
	expect(state.confirmCalls).toBe(0);
	expect(await Bun.file(join(home, "config.toml")).exists()).toBe(false);
	rmSync(home, { recursive: true, force: true });
});

test("declining the prompt leaves config.toml untouched", async () => {
	const home = tmpCodexHome();
	seedPluginCache(home, "alpha", "1.0.0");
	writeFileSync(join(home, "config.toml"), 'model = "gpt-5.6"\n');
	state.confirmAnswer = false;
	state.confirmCalls = 0;
	await runUnderTTY(promptHooksTrust, home);
	expect(state.confirmCalls).toBe(1);
	expect(readFileSync(join(home, "config.toml"), "utf8")).toBe('model = "gpt-5.6"\n');
	rmSync(home, { recursive: true, force: true });
});

test("no cached plugin hooks: nothing is written, and the prompt never fires", async () => {
	const home = tmpCodexHome();
	state.confirmAnswer = true;
	state.confirmCalls = 0;
	await runUnderTTY(promptHooksTrust, home);
	expect(state.confirmCalls).toBe(0);
	expect(await Bun.file(join(home, "config.toml")).exists()).toBe(false);
	rmSync(home, { recursive: true, force: true });
});
