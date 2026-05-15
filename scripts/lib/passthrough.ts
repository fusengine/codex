import { cp, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ConverterResult } from "./types";

const PASSTHROUGH_DIRS = [
	"rules",
	"templates",
	"docs",
	"scripts",
	".cartographer",
	"statusline",
	"song",
] as const;

async function exists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

export async function copyPassthrough(
	srcDir: string,
	destDir: string,
): Promise<ConverterResult> {
	const errors: string[] = [];
	let converted = 0;
	await mkdir(destDir, { recursive: true });
	for (const name of PASSTHROUGH_DIRS) {
		const srcPath = join(srcDir, name);
		if (!(await exists(srcPath))) continue;
		try {
			await cp(srcPath, join(destDir, name), { recursive: true });
			converted++;
		} catch (err) {
			errors.push(`copy ${name}: ${(err as Error).message}`);
		}
	}
	return { converted, errors };
}
