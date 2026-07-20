/**
 * harness-sound.test.ts — promptHarnessSound: keeping sounds on removes FUSE_HARNESS_SOUND
 * (default-on), declining writes "0"; per-kind overrides are only prompted when the user
 * opts into customization, and are plain path strings (not booleans).
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

const { promptHarnessSound } = await import("./harness-sound");
const { loadEnvFile } = await import("./env-file");

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-harness-sound-"));
}

test("keeping sounds enabled removes FUSE_HARNESS_SOUND (default-on, no key)", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_HARNESS_SOUND="0"\n', { mode: 0o600 });
	queue.confirms = [true, false];
	queue.texts = [];
	await promptHarnessSound(home);
	expect(loadEnvFile(home).FUSE_HARNESS_SOUND).toBeUndefined();
	rmSync(home, { recursive: true, force: true });
});

test("declining sounds writes FUSE_HARNESS_SOUND=0", async () => {
	const home = tmpCodexHome();
	queue.confirms = [false, false];
	queue.texts = [];
	await promptHarnessSound(home);
	expect(loadEnvFile(home).FUSE_HARNESS_SOUND).toBe("0");
	rmSync(home, { recursive: true, force: true });
});

test("customizing writes a per-kind absolute-path override, not a boolean", async () => {
	const home = tmpCodexHome();
	queue.confirms = [true, true];
	queue.texts = ["/tmp/stop.mp3", "", ""];
	await promptHarnessSound(home);
	const env = loadEnvFile(home);
	expect(env.FUSE_HARNESS_SOUND_STOP).toBe("/tmp/stop.mp3");
	expect(env.FUSE_HARNESS_SOUND_PERMISSION).toBeUndefined();
	expect(env.FUSE_HARNESS_SOUND_HUMAN).toBeUndefined();
	rmSync(home, { recursive: true, force: true });
});

test("skipping customization prompts no per-kind overrides", async () => {
	const home = tmpCodexHome();
	queue.confirms = [true, false];
	queue.texts = [];
	await promptHarnessSound(home);
	expect(queue.texts.length).toBe(0);
	rmSync(home, { recursive: true, force: true });
});
