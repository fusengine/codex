/**
 * harness-env.test.ts — promptHarnessEnv's non-prompt marketplaces write survives the
 * non-TTY guard, and a leftover `_FUSENGINE_HARNESS_ASKED` marker is actively purged (not
 * just ignored). bun:test has no TTY, so promptHarnessEnv exits via the non-interactive
 * early-return in every test below — the regression under test is that the marketplaces
 * write happens BEFORE that return, not that the interactive block is reached. `skipEnv:
 * true` (the `--skip-env` CLI flag) is exercised separately, since it short-circuits BEFORE
 * the non-TTY check.
 *
 * The interactive block itself (multiselect onward) is UNREACHABLE from a non-TTY test
 * without simulating a TTY — that coverage lives in the sibling `harness-env-tty.test.ts`
 * (split out at the SOLID 90-line threshold), which proves the prompt block is actually
 * entered, not silently re-gated, even with a stale marker on disk. Without that file, a
 * silent gate inserted AFTER the purge (e.g. `if (env.FUSE_HARNESS_MARKETPLACES !==
 * undefined) return;`) would leave every test in THIS file green — that gap is what this
 * file previously mis-titled as already covered.
 */
import { test, expect } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promptHarnessEnv } from "./harness-env";
import { loadEnvFile } from "./env-file";

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-harness-env-"));
}

test("a leftover _FUSENGINE_HARNESS_ASKED marker is purged from .env (does not gate anything, is just dead state)", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export _FUSENGINE_HARNESS_ASKED="1"\n', { mode: 0o600 });
	await promptHarnessEnv(home);
	const env = loadEnvFile(home);
	expect(env._FUSENGINE_HARNESS_ASKED).toBeUndefined();
	expect(env.FUSE_HARNESS_MARKETPLACES).toBe("fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test("FUSE_HARNESS_MARKETPLACES is written on a fresh install (no .env yet)", async () => {
	const home = tmpCodexHome();
	await promptHarnessEnv(home);
	expect(loadEnvFile(home).FUSE_HARNESS_MARKETPLACES).toBe("fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test("an existing FUSE_HARNESS_MARKETPLACES value is preserved, not overwritten", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_HARNESS_MARKETPLACES="fusengine-plugins"\n', { mode: 0o600 });
	await promptHarnessEnv(home);
	expect(loadEnvFile(home).FUSE_HARNESS_MARKETPLACES).toBe("fusengine-plugins,fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test("never proposes or writes the harness OUTPUT vars (SOLID_PROJECT_TYPE/FILE_LIMIT/INTERFACE_DIR)", async () => {
	const home = tmpCodexHome();
	await promptHarnessEnv(home);
	const env = loadEnvFile(home);
	expect(env.SOLID_PROJECT_TYPE).toBeUndefined();
	expect(env.SOLID_FILE_LIMIT).toBeUndefined();
	expect(env.SOLID_INTERFACE_DIR).toBeUndefined();
	rmSync(home, { recursive: true, force: true });
});

test("--skip-env (skipEnv: true) still runs ensureHarnessMarketplace unconditionally", async () => {
	const home = tmpCodexHome();
	await promptHarnessEnv(home, true);
	expect(loadEnvFile(home).FUSE_HARNESS_MARKETPLACES).toBe("fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test("--skip-env (skipEnv: true) purges the legacy marker too (unconditional, not a prompt)", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export _FUSENGINE_HARNESS_ASKED="1"\n', { mode: 0o600 });
	await promptHarnessEnv(home, true);
	expect(loadEnvFile(home)._FUSENGINE_HARNESS_ASKED).toBeUndefined();
	rmSync(home, { recursive: true, force: true });
});

test("--skip-env (skipEnv: true) leaves pre-existing harness toggles untouched", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export RALPH_MODE="1"\nexport FUSE_SOLID_MAX_LINES="150"\n', { mode: 0o600 });
	await promptHarnessEnv(home, true);
	const env = loadEnvFile(home);
	expect(env.RALPH_MODE).toBe("1");
	expect(env.FUSE_SOLID_MAX_LINES).toBe("150");
	rmSync(home, { recursive: true, force: true });
});

test("without --skip-env (default), the block is entered — non-TTY still writes marketplaces then exits early", async () => {
	const home = tmpCodexHome();
	await promptHarnessEnv(home, false);
	expect(loadEnvFile(home).FUSE_HARNESS_MARKETPLACES).toBe("fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});
