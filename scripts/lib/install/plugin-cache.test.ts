import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installPluginCache } from "./plugin-cache";

function tempRoot(): string {
	return mkdtempSync(join(tmpdir(), "codex-plugin-cache-"));
}

test("installPluginCache excludes .harness runtime cache but keeps hooks.json", async () => {
	const projectRoot = tempRoot();
	const codexHome = tempRoot();
	const pluginDir = join(projectRoot, "plugins", "alpha");
	mkdirSync(join(pluginDir, ".codex-plugin"), { recursive: true });
	mkdirSync(join(pluginDir, "hooks"), { recursive: true });
	mkdirSync(join(pluginDir, "scripts", ".harness"), { recursive: true });
	writeFileSync(join(pluginDir, ".codex-plugin", "plugin.json"), JSON.stringify({ version: "1.0.0" }));
	writeFileSync(join(pluginDir, "hooks", "hooks.json"), "{}");
	writeFileSync(join(pluginDir, "scripts", ".harness", "cache.json"), "{}");

	const installed = await installPluginCache(projectRoot, codexHome, "fusengine-codex");

	const cachedPlugin = join(codexHome, "plugins", "cache", "fusengine-codex", "alpha", "1.0.0");
	expect(installed).toBe(1);
	expect(readdirSync(join(cachedPlugin, "hooks"))).toContain("hooks.json");
	expect(readdirSync(join(cachedPlugin, "scripts"))).not.toContain(".harness");

	rmSync(projectRoot, { recursive: true, force: true });
	rmSync(codexHome, { recursive: true, force: true });
});
