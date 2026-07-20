/**
 * harness-env.test.ts — promptHarnessEnv's non-prompt marketplaces write survives the
 * non-TTY guard and the repeat-install (_FUSENGINE_HARNESS_ASKED) guard. bun:test has no
 * TTY, so promptHarnessEnv always exits via the non-interactive early-return here — the
 * regression under test is that the marketplaces write happens BEFORE that return.
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

test("FUSE_HARNESS_MARKETPLACES is written even when _FUSENGINE_HARNESS_ASKED is already set", async () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export _FUSENGINE_HARNESS_ASKED="1"\n', { mode: 0o600 });
	await promptHarnessEnv(home);
	const env = loadEnvFile(home);
	expect(env._FUSENGINE_HARNESS_ASKED).toBe("1");
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
