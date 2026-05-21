#!/usr/bin/env bun
/* Bun → Python wrapper. Original preserved at _legacy_py/../_legacy_py/_shared/cache_compactor.py. */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

const here = dirname(import.meta.path);
const py = join(here, "../_legacy_py/_shared/cache_compactor.py");

function findPluginRoot(start: string): string {
	let dir = start;
	while (dir !== dirname(dir)) {
		if (existsSync(join(dir, ".codex-plugin", "plugin.json"))) return dir;
		dir = dirname(dir);
	}
	return dirname(here);
}

const pluginRoot = findPluginRoot(here);
const codexHome = process.env.CODEX_HOME ?? join(homedir(), ".codex");
const sharedScripts = join(pluginRoot, "..", "_shared", "scripts");
const pythonPath = [sharedScripts, process.env.PYTHONPATH].filter(Boolean).join(":");

const proc = Bun.spawn(["python3", py], {
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
	env: {
		...process.env,
		CODEX_HOME: codexHome,
		PLUGIN_ROOT: process.env.PLUGIN_ROOT ?? pluginRoot,
		PLUGIN_DATA: process.env.PLUGIN_DATA ?? join(codexHome, "fusengine", "plugins", basename(pluginRoot)),
		PYTHONPATH: pythonPath,
	},
});
process.exit(await proc.exited);
