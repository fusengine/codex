/**
 * harness-solid.test.ts — promptSolidMaxLines writes the selected FUSE_SOLID_MAX_LINES
 * choice, defaults its initialValue to 100 on a fresh install, applies a keep/replace
 * confirm for an already-set value, and leaves .env untouched on cancel. @clack/prompts is
 * mocked (no TTY under bun:test — see config-prompt.test.ts).
 */
import { test, expect, mock, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clackPromptsMock } from "./clack-prompts-mock";

const queue = { selects: [] as (string | undefined)[], confirms: [] as (boolean | undefined)[] };

mock.module("@clack/prompts", () =>
	clackPromptsMock({
		select: mock(async () => queue.selects.shift()),
		confirm: mock(async () => queue.confirms.shift()),
		isCancel: mock((value: unknown) => value === undefined),
	}),
);

afterEach(() => mock.restore());

const { promptSolidMaxLines } = await import("./harness-solid");
const { loadEnvFile } = await import("./env-file");

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-harness-solid-"));
}

test("writes the selected FUSE_SOLID_MAX_LINES value", async () => {
	const home = tmpCodexHome();
	queue.selects = ["150"];
	await promptSolidMaxLines(home);
	expect(loadEnvFile(home).FUSE_SOLID_MAX_LINES).toBe("150");
	rmSync(home, { recursive: true, force: true });
});

test("cancel on the keep/replace gate leaves .env untouched", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_SOLID_MAX_LINES="120"\n', { mode: 0o600 });
	queue.confirms = [undefined];
	await promptSolidMaxLines(home);
	expect(loadEnvFile(home).FUSE_SOLID_MAX_LINES).toBe("120");
	rmSync(home, { recursive: true, force: true });
});

test("keep/replace: keeping an already-set value leaves it untouched, no select shown", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_SOLID_MAX_LINES="120"\n', { mode: 0o600 });
	queue.confirms = [true]; // keep it? yes
	queue.selects = [];
	await promptSolidMaxLines(home);
	expect(loadEnvFile(home).FUSE_SOLID_MAX_LINES).toBe("120");
	expect(queue.selects.length).toBe(0);
	rmSync(home, { recursive: true, force: true });
});

test("keep/replace: declining to keep re-prompts the select", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_SOLID_MAX_LINES="120"\n', { mode: 0o600 });
	queue.confirms = [false]; // keep it? no
	queue.selects = ["200"];
	await promptSolidMaxLines(home);
	expect(loadEnvFile(home).FUSE_SOLID_MAX_LINES).toBe("200");
	rmSync(home, { recursive: true, force: true });
});
