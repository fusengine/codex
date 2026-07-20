/**
 * harness-tuning.test.ts — promptHarnessTuning is opt-in (skipped confirm = no write),
 * persists only values that differ from the field defaults, and removes a key when the
 * user re-enters the default.
 */
import { test, expect, mock, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clackPromptsMock } from "./clack-prompts-mock";

const queue = { confirms: [] as (boolean | undefined)[], texts: [] as (string | undefined)[] };

mock.module("@clack/prompts", () =>
	clackPromptsMock({
		confirm: mock(async () => queue.confirms.shift()),
		text: mock(async () => queue.texts.shift()),
		isCancel: mock((value: unknown) => value === undefined),
	}),
);

afterEach(() => mock.restore());

const { promptHarnessTuning } = await import("./harness-tuning");
const { loadEnvFile } = await import("./env-file");

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-harness-tuning-"));
}

test("declining the opt-in confirm writes nothing", async () => {
	const home = tmpCodexHome();
	queue.confirms = [false];
	queue.texts = [];
	await promptHarnessTuning(home);
	const env = loadEnvFile(home);
	expect(env.FUSE_LESSONS_THROTTLE_MIN).toBeUndefined();
	expect(env.FUSENGINE_CACHE_TTL_MIN).toBeUndefined();
	rmSync(home, { recursive: true, force: true });
});

test("re-entering the defaults persists nothing (both fields removed)", async () => {
	const home = tmpCodexHome();
	writeFileSync(home + "/.env", 'export FUSE_LESSONS_THROTTLE_MIN="15"\n', { mode: 0o600 });
	queue.confirms = [true];
	queue.texts = ["5", "30"];
	await promptHarnessTuning(home);
	const env = loadEnvFile(home);
	expect(env.FUSE_LESSONS_THROTTLE_MIN).toBeUndefined();
	expect(env.FUSENGINE_CACHE_TTL_MIN).toBeUndefined();
	rmSync(home, { recursive: true, force: true });
});

test("a non-default value is persisted for both fields", async () => {
	const home = tmpCodexHome();
	queue.confirms = [true];
	queue.texts = ["10", "60"];
	await promptHarnessTuning(home);
	const env = loadEnvFile(home);
	expect(env.FUSE_LESSONS_THROTTLE_MIN).toBe("10");
	expect(env.FUSENGINE_CACHE_TTL_MIN).toBe("60");
	rmSync(home, { recursive: true, force: true });
});
