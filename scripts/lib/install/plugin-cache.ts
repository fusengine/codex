/**
 * plugin-cache.ts — install local marketplace plugins into Codex cache.
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { listPlugins } from "./codex-cli";

interface PluginManifest {
	version?: string;
}

async function pluginVersion(projectRoot: string, name: string): Promise<string> {
	const path = join(projectRoot, "plugins", name, ".codex-plugin", "plugin.json");
	const manifest = (await Bun.file(path).json()) as PluginManifest;
	return manifest.version ?? "0.0.0";
}

/**
 * Excludes VCS/OS noise plus gitignored runtime-cache dirs (`.harness`) that
 * plugins write locally at dev time — `.cartographer` is tracked and shipped
 * on purpose, so it stays out of this list.
 */
function shouldCopy(source: string): boolean {
	return !/(^|\/)(node_modules|\.git|\.DS_Store|\.harness)$/.test(source);
}

/**
 * Copy every repo plugin into `$CODEX_HOME/plugins/cache/<marketplaceName>/<name>/<version>`,
 * replacing any existing cached copy at that version.
 * @param projectRoot - repo root containing `plugins/<name>/.codex-plugin/plugin.json`.
 * @param codexHome - target `$CODEX_HOME` to cache plugins into.
 * @param marketplaceName - marketplace namespace segment of the cache path.
 * @returns the number of plugins cached.
 */
export async function installPluginCache(
	projectRoot: string,
	codexHome: string,
	marketplaceName: string,
): Promise<number> {
	let installed = 0;
	for (const name of await listPlugins(projectRoot)) {
		const version = await pluginVersion(projectRoot, name);
		const src = join(projectRoot, "plugins", name);
		const dest = join(codexHome, "plugins", "cache", marketplaceName, name, version);
		await rm(dest, { recursive: true, force: true });
		await mkdir(dest, { recursive: true });
		await cp(src, dest, { recursive: true, force: true, filter: shouldCopy });
		installed++;
	}
	return installed;
}
