/**
 * features.test.ts — bypass_hook_trust is opt-in and never re-prompted once set.
 */
import { test, expect, mock, describe, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const state = { confirmAnswer: false, confirmCalls: 0 };

mock.module("@clack/prompts", () => ({
	confirm: mock(async () => {
		state.confirmCalls++;
		return state.confirmAnswer;
	}),
	isCancel: mock((value: unknown) => typeof value === "symbol"),
}));

afterEach(() => mock.restore());

const { ensureFeaturesEnabled } = await import("./features");

function tmpHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-features-"));
}

describe("ensureFeaturesEnabled — bypass_hook_trust opt-in", () => {
	beforeEach(() => {
		state.confirmAnswer = false;
		state.confirmCalls = 0;
	});

	test("declining the prompt leaves the key unwritten", async () => {
		const home = tmpHome();
		await ensureFeaturesEnabled(home);
		expect(state.confirmCalls).toBe(1);
		expect(readFileSync(join(home, "config.toml"), "utf-8")).not.toMatch(/bypass_hook_trust/);
		rmSync(home, { recursive: true, force: true });
	});

	test("accepting the prompt writes bypass_hook_trust = true", async () => {
		state.confirmAnswer = true;
		const home = tmpHome();
		await ensureFeaturesEnabled(home);
		expect(state.confirmCalls).toBe(1);
		expect(readFileSync(join(home, "config.toml"), "utf-8")).toMatch(/bypass_hook_trust = true/);
		rmSync(home, { recursive: true, force: true });
	});

	test("a pre-existing value in config.toml is kept, and the prompt never fires", async () => {
		const home = tmpHome();
		const path = join(home, "config.toml");
		await Bun.write(path, "bypass_hook_trust = false\n");
		state.confirmAnswer = true; // would flip the value if the prompt were (wrongly) honored
		await ensureFeaturesEnabled(home);
		expect(state.confirmCalls).toBe(0);
		expect(readFileSync(path, "utf-8")).toMatch(/bypass_hook_trust = false/);
		rmSync(home, { recursive: true, force: true });
	});
});
