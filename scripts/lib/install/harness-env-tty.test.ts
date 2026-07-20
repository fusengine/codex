/**
 * harness-env-tty.test.ts — split out of harness-env.test.ts (SOLID 90-line threshold): the
 * ONE test in this repo that actually simulates a TTY to prove promptHarnessEnv's interactive
 * block (multiselect onward) is reached, not silently re-gated after the marker purge.
 * bun:test itself has no TTY, so every test in harness-env.test.ts exits via the
 * non-interactive early-return — none of them can prove the prompt block is reachable. This
 * file flips `process.stdin.isTTY` and mocks `@clack/prompts` (via the shared
 * `clackPromptsMock` helper) to close that gap: without it, a silent gate inserted AFTER the
 * purge (e.g. `if (env.FUSE_HARNESS_MARKETPLACES !== undefined) return;`) would leave every
 * other harness-env test green.
 */
import { test, expect, mock, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clackPromptsMock } from "./clack-prompts-mock";

const calls = { multiselect: 0 };

mock.module("@clack/prompts", () =>
	clackPromptsMock({
		multiselect: mock(async () => {
			calls.multiselect++;
			return [];
		}),
		isCancel: mock((value: unknown) => value === undefined),
	}),
);

afterEach(() => mock.restore());

const { promptHarnessEnv } = await import("./harness-env");

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-harness-env-tty-"));
}

test("under a simulated TTY, a stale marker + a fresh install still reach the multiselect (no silent post-purge gate)", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export _FUSENGINE_HARNESS_ASKED="1"\n', { mode: 0o600 });
	calls.multiselect = 0;
	const originalIsTTY = process.stdin.isTTY;
	const originalCI = process.env.CI;
	process.stdin.isTTY = true;
	delete process.env.CI;
	try {
		await promptHarnessEnv(home);
	} finally {
		process.stdin.isTTY = originalIsTTY;
		if (originalCI !== undefined) process.env.CI = originalCI;
	}
	expect(calls.multiselect).toBe(1);
	rmSync(home, { recursive: true, force: true });
});
