/**
 * fs-helpers.ts — File copy / exec / compare helpers for installer.
 * Ported from claude-plugins/scripts/src/utils/fs-helpers.ts.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { $ } from "bun";

/** Copy a file, creating destination directory if needed. */
export function copyFile(src: string, dest: string): boolean {
	if (!existsSync(src)) return false;
	mkdirSync(dirname(dest), { recursive: true });
	copyFileSync(src, dest);
	return true;
}

/** Copy a file and mark it executable. */
export async function copyExecutable(
	src: string,
	dest: string,
): Promise<boolean> {
	if (!copyFile(src, dest)) return false;
	await $`chmod +x ${dest}`.quiet();
	return true;
}

/** Make every *.sh script under `dir` executable. Returns count touched. */
export async function makeScriptsExecutable(dir: string): Promise<number> {
	if (!existsSync(dir)) return 0;
	const result = await $`find ${dir} -name "*.sh" -type f`.quiet().nothrow();
	const files = result.text().trim().split("\n").filter(Boolean);
	for (const file of files) {
		await $`chmod +x ${file}`.quiet().nothrow();
	}
	return files.length;
}

/** Run `bun install --silent` inside a directory that has package.json. */
export async function installPluginDeps(dir: string): Promise<boolean> {
	if (!existsSync(join(dir, "package.json"))) return false;
	const result = await $`cd ${dir} && bun install --silent`.quiet().nothrow();
	return result.exitCode === 0;
}

/** Byte-compare two files by content. */
export async function filesAreEqual(
	path1: string,
	path2: string,
): Promise<boolean> {
	if (!existsSync(path1) || !existsSync(path2)) return false;
	const a = await Bun.file(path1).text();
	const b = await Bun.file(path2).text();
	return a === b;
}
