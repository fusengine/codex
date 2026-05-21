#!/usr/bin/env bun
/**
 * Repository validation entry point.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { scanPlugins } from "./lib/install/plugin-scanner";

function run(label: string, args: string[]): void {
	const proc = Bun.spawnSync(args, { stderr: "pipe", stdout: "pipe" });
	if (proc.exitCode !== 0) {
		console.error(`[FAIL] ${label}\n${proc.stdout}${proc.stderr}`);
		process.exit(proc.exitCode ?? 1);
	}
	if (proc.stdout.length) process.stdout.write(proc.stdout);
}

function validateHookTargets(): void {
	for (const plugin of scanPlugins(join(import.meta.dir, "..", "plugins"))) {
		const file = join(plugin.path, "hooks", "hooks.json");
		if (!existsSync(file)) continue;
		const data = JSON.parse(readFileSync(file, "utf8"));
		for (const entries of Object.values(data.hooks ?? {}) as any[]) {
			for (const entry of entries) {
				if (/mcp_tool_call|^bash$|Write|Edit/.test(entry.matcher ?? "")) {
					throw new Error(`${file}: invalid matcher '${entry.matcher}'`);
				}
				for (const hook of entry.hooks ?? []) {
					const match = String(hook.command ?? "").match(/\$\{PLUGIN_ROOT\}\/([^\s"']+)/);
					if (match && !existsSync(join(plugin.path, match[1]))) {
						throw new Error(`${file}: missing hook target ${match[1]}`);
					}
				}
			}
		}
	}
	console.log("[OK] hook targets and matchers");
}

validateHookTargets();
run("session tests ts", ["bun", "test", "./plugins/core-guards/scripts/tests/test-sessions-pattern.ts"]);
run("session tests py", ["python3", "plugins/core-guards/scripts/_legacy_py/tests/test-sessions-pattern.py"]);
