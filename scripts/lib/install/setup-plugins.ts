/**
 * setup-plugins.ts — Prepare installed plugins: scripts +x, deps installed.
 * Adapted from claude-plugins/scripts/src/services/setup-plugins.ts.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { installPluginDeps, makeScriptsExecutable } from "./fs-helpers";

/** List immediate subdirectories of `pluginsDir`. */
function listPluginDirs(pluginsDir: string): string[] {
	if (!existsSync(pluginsDir)) return [];
	return readdirSync(pluginsDir)
		.filter((name) => !name.startsWith("."))
		.map((name) => join(pluginsDir, name))
		.filter((path) => statSync(path).isDirectory());
}

/** Walk plugins, mark *.sh executable, run `bun install` where applicable. */
export async function scanAndPrepare(pluginsDir: string): Promise<void> {
	if (!existsSync(pluginsDir)) {
		p.log.warn(`plugins dir not found: ${pluginsDir}`);
		return;
	}

	const dirs = listPluginDirs(pluginsDir);

	const sx = p.spinner();
	sx.start("Making plugin scripts executable…");
	const scriptCount = await makeScriptsExecutable(pluginsDir);
	sx.stop(`${scriptCount} *.sh scripts made executable`);

	const dx = p.spinner();
	dx.start(`Installing dependencies for ${dirs.length} plugins…`);
	let installed = 0;
	for (const dir of dirs) {
		const ok = await installPluginDeps(dir);
		if (ok) installed++;
		const scriptsDir = join(dir, "scripts");
		if (existsSync(scriptsDir)) {
			const ok2 = await installPluginDeps(scriptsDir);
			if (ok2) installed++;
		}
	}
	dx.stop(`${installed} package.json installs completed`);
}
