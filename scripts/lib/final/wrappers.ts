// wrappers.ts — For each .ts in plugins/<X>/scripts that fails to compile
// with `bun build --no-bundle`, replace it with a Bun wrapper that runs the
// original Python preserved in _legacy_py/.
import { readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const wrapper = (relPathFromHere: string) =>
	`#!/usr/bin/env bun
/* Bun → Python wrapper. Original preserved at _legacy_py/${relPathFromHere}. */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
const here = dirname(import.meta.path);
const py = join(here, ${JSON.stringify(relPathFromHere)});

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
const sharedScripts = [
	process.env.FUSENGINE_SYS ? join(process.env.FUSENGINE_SYS, "shared", "scripts") : "",
	join(codexHome, "fusengine-sys", "shared", "scripts"),
	join(pluginRoot, "..", "_shared", "scripts"),
].filter(Boolean);
const pythonPath = [...sharedScripts, process.env.PYTHONPATH].filter(Boolean).join(":");
const proc = Bun.spawn(["python3", py], {
	stdin: "inherit", stdout: "inherit", stderr: "inherit",
	env: {
		...process.env,
		CODEX_HOME: codexHome,
		PLUGIN_ROOT: process.env.PLUGIN_ROOT ?? pluginRoot,
		PLUGIN_DATA: process.env.PLUGIN_DATA ?? join(codexHome, "fusengine", "plugins", basename(pluginRoot)),
		PYTHONPATH: pythonPath,
	},
});
process.exit(await proc.exited);
`;

async function buildOk(tsPath: string): Promise<boolean> {
	const proc = Bun.spawnSync(
		["bun", "build", "--no-bundle", "--target=bun", tsPath, "--outfile=/tmp/_chk.js"],
		{ stderr: "pipe", stdout: "pipe" },
	);
	return proc.exitCode === 0;
}

async function legacyExists(p: string): Promise<boolean> {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
}

export async function fixBrokenScripts(pluginsRoot: string): Promise<number> {
	let count = 0;
	for (const dir of await readdir(pluginsRoot, { withFileTypes: true })) {
		if (!dir.isDirectory()) continue;
		const scripts = join(pluginsRoot, dir.name, "scripts");
		const legacy = join(scripts, "_legacy_py");
		if (!(await legacyExists(legacy))) continue;
		count += await walk(scripts, scripts, legacy);
	}
	console.log(`[OK] ${count} broken .ts → Python wrappers`);
	return count;
}

async function walk(root: string, dir: string, legacyDir: string): Promise<number> {
	let count = 0;
	for (const e of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) {
			if (e.name === "_legacy_py" || e.name === "node_modules") continue;
			count += await walk(root, p, legacyDir);
		} else if (e.isFile() && e.name.endsWith(".ts")) {
			const rel = relative(root, p);
			const py = join(legacyDir, rel.replace(/\.ts$/, ".py"));
			if (!(await legacyExists(py))) continue;
			if (await buildOk(p)) continue;
			const fromHere = relative(dirname(p), py);
			await Bun.write(p, wrapper(fromHere));
			count++;
		}
	}
	return count;
}
