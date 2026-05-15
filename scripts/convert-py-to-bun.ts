#!/usr/bin/env bun
/**
 * convert-py-to-bun.ts — Best-effort batch conversion of plugin Python
 * scripts into Bun TypeScript stubs. For each .py: regex-transform → .ts,
 * archive original to _legacy_py/. Emits py-to-bun-report.json.
 */
import { readdir, mkdir, rename } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { transformPython } from "./lib/py-transform";

interface ConvertReport {
	startedAt: string;
	finishedAt: string;
	converted: { path: string; warnings: string[] }[];
	failed: { path: string; error: string }[];
}

async function walkPy(root: string): Promise<string[]> {
	const out: string[] = [];
	async function rec(dir: string) {
		let entries;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			const p = join(dir, e.name);
			if (e.isDirectory()) {
				if (e.name === "node_modules" || e.name === "_legacy_py") continue;
				await rec(p);
			} else if (e.isFile() && e.name.endsWith(".py")) out.push(p);
		}
	}
	await rec(root);
	return out;
}

async function convertOne(pyPath: string, pluginsRoot: string): Promise<string[]> {
	const src = await Bun.file(pyPath).text();
	const { code, warnings } = transformPython(src, pyPath);
	await Bun.write(pyPath.replace(/\.py$/, ".ts"), code);
	const rel = relative(pluginsRoot, pyPath);
	const [plugin, ...rest] = rel.split("/");
	const legacy = join(pluginsRoot, plugin, "scripts", "_legacy_py", rest.slice(1).join("/"));
	await mkdir(dirname(legacy), { recursive: true });
	await rename(pyPath, legacy);
	return warnings;
}

async function main() {
	const pluginsRoot = join(import.meta.dir, "..", "plugins");
	const pyFiles = await walkPy(pluginsRoot);
	console.log(`Found ${pyFiles.length} .py files to convert.`);
	const report: ConvertReport = {
		startedAt: new Date().toISOString(),
		finishedAt: "",
		converted: [],
		failed: [],
	};
	for (const py of pyFiles) {
		try {
			const warnings = await convertOne(py, pluginsRoot);
			report.converted.push({ path: relative(pluginsRoot, py), warnings });
			console.log(`  ${warnings.length > 0 ? `[!${warnings.length}]` : "[OK]"} ${relative(pluginsRoot, py)}`);
		} catch (e) {
			report.failed.push({ path: relative(pluginsRoot, py), error: (e as Error).message });
			console.log(`  [FAIL] ${relative(pluginsRoot, py)}: ${(e as Error).message}`);
		}
	}
	report.finishedAt = new Date().toISOString();
	await Bun.write(join(pluginsRoot, "py-to-bun-report.json"), JSON.stringify(report, null, 2));
	console.log(`\nDone: ${report.converted.length} converted, ${report.failed.length} failed.`);
}

if (import.meta.main) await main();
