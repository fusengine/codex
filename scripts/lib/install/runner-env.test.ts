/**
 * runner-env.test.ts — closes the coverage gap the challenger proved: the `skipEnv: true`
 * branch of `runEnvPromptBlock` was reachable through zero tests. Forgetting the 2nd arg on
 * `promptHarnessEnv(opts.codexHome)` (it defaults to `false`, so `tsc` sees nothing wrong) or
 * deleting the `await promptHarnessEnv(...)` call entirely broke no test before this file. No
 * `@clack/prompts` mock needed: under `skipEnv: true` the block never reaches an interactive
 * prompt — it only runs the unconditional marketplace-allowlist write.
 */
import { test, expect } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runEnvPromptBlock } from "./runner-env";
import { loadEnvFile } from "./env-file";
import type { SetupOptions } from "./runner";

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-runner-env-"));
}

test("skipEnv:true still writes FUSE_HARNESS_MARKETPLACES via the unconditional marketplace step", async () => {
	const codexHome = tmpCodexHome();
	const opts: SetupOptions = {
		projectRoot: process.cwd(),
		codexHome,
		marketplaceName: "fusengine-codex",
		skipPluginInstall: true,
		skipEnv: true,
	};
	await runEnvPromptBlock(opts);
	expect(loadEnvFile(codexHome).FUSE_HARNESS_MARKETPLACES).toBe("fusengine-codex");
	rmSync(codexHome, { recursive: true, force: true });
});

test("skipEnv:true purges the legacy _FUSENGINE_HARNESS_ASKED marker too", async () => {
	const codexHome = tmpCodexHome();
	const { writeFileSync, mkdirSync } = await import("node:fs");
	mkdirSync(codexHome, { recursive: true });
	writeFileSync(join(codexHome, ".env"), 'export _FUSENGINE_HARNESS_ASKED="1"\n', { mode: 0o600 });
	const opts: SetupOptions = {
		projectRoot: process.cwd(),
		codexHome,
		marketplaceName: "fusengine-codex",
		skipPluginInstall: true,
		skipEnv: true,
	};
	await runEnvPromptBlock(opts);
	expect(loadEnvFile(codexHome)._FUSENGINE_HARNESS_ASKED).toBeUndefined();
	rmSync(codexHome, { recursive: true, force: true });
});
