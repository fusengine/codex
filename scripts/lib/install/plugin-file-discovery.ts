import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { PluginFile } from "./plugin-file.types";

export async function pathExists(path: string): Promise<boolean> {
	try { await lstat(path); return true; } catch { return false; }
}

export function compareVersionsDesc(a: string, b: string): number {
	const left = a.split(/[.-]/).map((part) => Number.parseInt(part, 10));
	const right = b.split(/[.-]/).map((part) => Number.parseInt(part, 10));
	const max = Math.max(left.length, right.length);
	for (let i = 0; i < max; i++) {
		const av = Number.isNaN(left[i]) ? 0 : (left[i] ?? 0);
		const bv = Number.isNaN(right[i]) ? 0 : (right[i] ?? 0);
		if (av !== bv) return bv - av;
	}
	return b.localeCompare(a);
}

async function listVersionedFiles(
	pluginRoot: string,
	plugin: string,
	subdir: string,
	extension: string,
): Promise<PluginFile[]> {
	const versions = (await readdir(pluginRoot, { withFileTypes: true }))
		.filter((v) => v.isDirectory() && !v.name.startsWith("."))
		.map((v) => v.name)
		.sort(compareVersionsDesc);
	for (const version of versions) {
		const dir = join(pluginRoot, version, subdir);
		if (!(await pathExists(dir))) continue;
		const files = await readdir(dir);
		return files
			.filter((file) => file.endsWith(extension))
			.map((file) => ({ plugin, file, src: join(dir, file) }));
	}
	return [];
}

export async function listPluginFiles(
	pluginsRoot: string,
	subdir: string,
	extension: string,
): Promise<PluginFile[]> {
	const out: PluginFile[] = [];
	for (const e of await readdir(pluginsRoot, { withFileTypes: true })) {
		if (!e.isDirectory() || e.name.startsWith(".") || e.name === "_shared") continue;
		const dir = join(pluginsRoot, e.name, subdir);
		if (await pathExists(dir)) {
			for (const file of await readdir(dir)) {
				if (file.endsWith(extension)) out.push({ plugin: e.name, file, src: join(dir, file) });
			}
			continue;
		}
		out.push(...await listVersionedFiles(join(pluginsRoot, e.name), e.name, subdir, extension));
	}
	return out;
}
