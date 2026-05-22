/**
 * runtime-shared.ts - Install marketplace-wide shared hook scripts in a stable
 * Fusengine runtime location under CODEX_HOME.
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";

function shouldCopy(source: string): boolean {
	return !/(^|\/)(node_modules|\.git|\.DS_Store|__pycache__)$/.test(source);
}

export async function installRuntimeShared(projectRoot: string, codexHome: string): Promise<string> {
	const src = join(projectRoot, "plugins", "_shared", "scripts");
	const dest = join(codexHome, "fusengine-sys", "shared", "scripts");
	await rm(dest, { recursive: true, force: true });
	await mkdir(dest, { recursive: true });
	await cp(src, dest, { recursive: true, force: true, filter: shouldCopy });
	p.log.success(`runtime shared scripts installed -> ${dest}`);
	return dest;
}
