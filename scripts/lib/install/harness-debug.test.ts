/**
 * harness-debug.test.ts — promptHarnessDebug writes "1" when enabled, removes the key
 * (never writes "0") when disabled, and prefills initialValue from the current .env state.
 */
import { test, expect, mock, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clackPromptsMock } from "./clack-prompts-mock";

const queue = { confirms: [] as (boolean | undefined)[] };

mock.module("@clack/prompts", () =>
	clackPromptsMock({
		confirm: mock(async () => queue.confirms.shift()),
		isCancel: mock((value: unknown) => value === undefined),
	}),
);

afterEach(() => mock.restore());

const { promptHarnessDebug } = await import("./harness-debug");
const { loadEnvFile } = await import("./env-file");

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-harness-debug-"));
}

test("enabling writes FUSE_HARNESS_DEBUG=1", async () => {
	const home = tmpCodexHome();
	queue.confirms = [true];
	await promptHarnessDebug(home);
	expect(loadEnvFile(home).FUSE_HARNESS_DEBUG).toBe("1");
	rmSync(home, { recursive: true, force: true });
});

test("disabling removes the key rather than writing \"0\" (replace, then disable)", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_HARNESS_DEBUG="1"\n', { mode: 0o600 });
	queue.confirms = [false, false]; // keep? no -> enable? no
	await promptHarnessDebug(home);
	expect(loadEnvFile(home).FUSE_HARNESS_DEBUG).toBeUndefined();
	rmSync(home, { recursive: true, force: true });
});

test("cancel on the keep/replace gate leaves .env untouched", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_HARNESS_DEBUG="1"\n', { mode: 0o600 });
	queue.confirms = [undefined];
	await promptHarnessDebug(home);
	expect(loadEnvFile(home).FUSE_HARNESS_DEBUG).toBe("1");
	rmSync(home, { recursive: true, force: true });
});

test("keep/replace: choosing to keep an already-set value leaves it untouched, no re-prompt", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_HARNESS_DEBUG="1"\n', { mode: 0o600 });
	queue.confirms = [true]; // keep? yes -> returns before the enable/disable confirm
	await promptHarnessDebug(home);
	expect(loadEnvFile(home).FUSE_HARNESS_DEBUG).toBe("1");
	expect(queue.confirms.length).toBe(0);
	rmSync(home, { recursive: true, force: true });
});
