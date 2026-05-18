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

function shouldCopy(source: string): boolean {
	return !/(^|\/)(node_modules|\.git|\.DS_Store)$/.test(source);
}

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
