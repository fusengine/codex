#!/usr/bin/env bun
import { join } from "node:path";
import { validateDeprecatedFlagCleanup } from "./lib/deprecated-flag-validation";
import { validateHookConfigs } from "./lib/hook-config-validation";

function run(label: string, args: string[]): void {
	const proc = Bun.spawnSync(args, { stderr: "pipe", stdout: "pipe" });
	if (proc.exitCode !== 0) {
		console.error(`[FAIL] ${label}\n${proc.stdout}${proc.stderr}`);
		process.exit(proc.exitCode ?? 1);
	}
	if (proc.stdout.length) process.stdout.write(proc.stdout);
}

validateHookConfigs(join(import.meta.dir, ".."));
console.log("[OK] hook targets, matchers, and Harness wiring");
validateDeprecatedFlagCleanup();
console.log("[OK] deprecated codex_hooks cleanup coverage");
run("session tests ts", ["bun", "test", "./plugins/core-guards/scripts/tests/test-sessions-pattern.ts"]);
run("runtime shared wrapper tests", ["bun", "test", "./scripts/tests/runtime-shared.test.mts"]);
run("shell read path tests", ["bun", "test", "./plugins/core-guards/scripts/_shared/tests/shell-read-paths.test.ts"]);
run("interface rule tests", ["bun", "test", "./plugins/core-guards/scripts/_shared/tests/interface-rules.test.ts"]);
