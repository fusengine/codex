#!/usr/bin/env bun
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanupDeprecatedCodexFlags } from "./lib/install/cleanup-deprecated-flags";
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
				if (/mcp_tool_call|^bash$/.test(entry.matcher ?? "")) {
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

function writeFixture(root: string, path: string, content: string): string {
	const file = join(root, path);
	mkdirSync(file.split("/").slice(0, -1).join("/"), { recursive: true });
	writeFileSync(file, content);
	return file;
}

function assertNoDeprecatedFlags(label: string, files: string[]): void {
	for (const file of files) {
		const content = readFileSync(file, "utf8");
		if (content.includes("codex_hooks") || content.includes("[features].codex_hooks")) {
			throw new Error(`${label}: deprecated flag remained in ${file}`);
		}
	}
}

function assertDeprecatedFlagsRemain(label: string, files: string[]): void {
	for (const file of files) {
		const content = readFileSync(file, "utf8");
		if (!content.includes("codex_hooks")) {
			throw new Error(`${label}: skipped file was unexpectedly rewritten: ${file}`);
		}
	}
}

function validateDeprecatedFlagCleanup(): void {
	const root = mkdtempSync(join(tmpdir(), "fusengine-cleanup-"));
	try {
		const managed = [
			writeFixture(root, "config.toml", "[features]\ncodex_hooks = true\nplugin_hooks = true\n"),
			writeFixture(root, ".codex-global-state.json", "{\"flag\":\"codex_hooks\"}\n"),
			writeFixture(root, "vendor_imports/skills/SKILL.md", "legacy [features].codex_hooks and codex_hooks\n"),
			writeFixture(root, "plugins/cache/fusengine-codex/foo/hooks.json", "{\"hook\":\"codex_hooks\"}\n"),
			writeFixture(root, ".tmp/marketplaces/fusengine-codex/plugins/foo/README.md", "codex_hooks in tmp marketplace\n"),
		];
		const skipped = [
			writeFixture(root, "sessions/log.md", "codex_hooks session should remain\n"),
			writeFixture(root, "memories/note.md", "codex_hooks memory should remain\n"),
			writeFixture(root, "logs/runtime.txt", "codex_hooks log should remain\n"),
			writeFixture(root, "node_modules/pkg/readme.md", "codex_hooks module should remain\n"),
		];
		const changed = cleanupDeprecatedCodexFlags(root);
		if (changed !== managed.length) {
			throw new Error(`deprecated cleanup changed ${changed} files, expected ${managed.length}`);
		}
		assertNoDeprecatedFlags("deprecated cleanup", managed);
		assertDeprecatedFlagsRemain("deprecated cleanup", skipped);
		console.log("[OK] deprecated codex_hooks cleanup coverage");
	} finally {
		rmSync(root, { force: true, recursive: true });
	}
}

validateHookTargets();
validateDeprecatedFlagCleanup();
run("session tests ts", ["bun", "test", "./plugins/core-guards/scripts/tests/test-sessions-pattern.ts"]);
run("session tests py", ["python3", "plugins/core-guards/scripts/_legacy_py/tests/test-sessions-pattern.py"]);
run("runtime shared wrapper tests", ["bun", "test", "./scripts/tests/runtime-shared.test.mts"]);
run("shell read path tests", ["python3", "plugins/_shared/scripts/tests/test_shell_read_paths.py"]);
run("interface rule tests", ["python3", "plugins/_shared/scripts/tests/test_interface_rules.py"]);
