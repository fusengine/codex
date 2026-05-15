#!/usr/bin/env bun
/**
 * scrub-codex-refs.ts — Global rename Codex → Codex across codex-plugins/.
 * Skips: node_modules, _legacy_py, migration-report.json, py-to-bun-report.json,
 * bun.lock, binary files. Writes scrub-report.json with the touched files.
 *
 * Rules sourced from doc Codex (developers.openai.com/codex/{hooks,plugins/build,
 * config-basic}): PLUGIN_ROOT, PLUGIN_DATA, CODEX_HOME, AGENTS.md, .codex-plugin/.
 */
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { applyRules } from "./lib/scrub-rules";

const ROOT = join(import.meta.dir, "..");
const SKIP_DIRS = new Set(["node_modules", "_legacy_py", ".git"]);
const SKIP_FILES = new Set(["bun.lock", "migration-report.json", "py-to-bun-report.json", "scrub-report.json"]);
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".json", ".md", ".toml", ".yaml", ".yml", ".sh", ".html", ".txt"]);

async function walk(dir: string, out: string[] = []): Promise<string[]> {
	for (const e of await readdir(dir, { withFileTypes: true })) {
		if (e.isDirectory()) {
			if (SKIP_DIRS.has(e.name)) continue;
			await walk(join(dir, e.name), out);
		} else if (e.isFile() && !SKIP_FILES.has(e.name)) {
			const ext = e.name.slice(e.name.lastIndexOf("."));
			if (TEXT_EXT.has(ext) || !ext.includes(".")) out.push(join(dir, e.name));
		}
	}
	return out;
}

async function main() {
	const files = await walk(ROOT);
	const touched: { path: string; replacements: number }[] = [];
	for (const f of files) {
		const before = await Bun.file(f).text();
		const { content, count } = applyRules(before);
		if (count > 0) {
			await Bun.write(f, content);
			touched.push({ path: relative(ROOT, f), replacements: count });
		}
	}
	console.log(`Scrubbed ${touched.length} files (${touched.reduce((s, t) => s + t.replacements, 0)} replacements).`);
	await Bun.write(join(ROOT, "plugins", "scrub-report.json"), JSON.stringify({ touched }, null, 2));
}

if (import.meta.main) await main();
