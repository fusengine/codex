#!/usr/bin/env bun
/**
 * fix-legacy-py-paths.ts — Patch _legacy_py/*.py files to use Codex paths
 * instead of Claude paths at runtime. These archived Python scripts are
 * still invoked by the Bun wrappers, so they must look at ~/.codex/ etc.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "plugins");

const RULES: [RegExp, string][] = [
	[/\$\{CLAUDE_PLUGIN_ROOT\}/g, "${PLUGIN_ROOT}"],
	[/\$\{CLAUDE_PLUGIN_DATA\}/g, "${PLUGIN_DATA}"],
	[/\bCLAUDE_PLUGIN_ROOT\b/g, "PLUGIN_ROOT"],
	[/\bCLAUDE_PLUGIN_DATA\b/g, "PLUGIN_DATA"],
	[/~\/\.claude\b/g, "~/.codex"],
	[/\.claude\/(logs|fusengine-cache|memories|state)/g, ".codex/$1"],
	[/\bCLAUDE\.md\b/g, "AGENTS.md"],
	[/\bCLAUDE_PROJECT_DIR\b/g, "CODEX_PROJECT_DIR"],
];

async function walk(dir: string, out: string[] = []): Promise<string[]> {
	for (const e of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) await walk(p, out);
		else if (e.isFile() && p.endsWith(".py") && p.includes("/_legacy_py/")) out.push(p);
	}
	return out;
}

async function main() {
	const files = await walk(ROOT);
	let touched = 0;
	let totalReps = 0;
	for (const f of files) {
		let txt = await Bun.file(f).text();
		const before = txt;
		for (const [pat, rep] of RULES) {
			txt = txt.replace(pat, () => {
				totalReps++;
				return rep;
			});
		}
		if (txt !== before) {
			await Bun.write(f, txt);
			touched++;
		}
	}
	console.log(`[OK] ${touched}/${files.length} _legacy_py patched (${totalReps} replacements)`);
}

if (import.meta.main) await main();
