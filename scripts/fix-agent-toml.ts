#!/usr/bin/env bun
/**
 * fix-agent-toml.ts — Convert """...""" to '''...''' in plugin agent TOML files.
 * Basic multiline strings process escapes (\X fails); literal strings don't.
 */
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const REPO = join(ROOT, "plugins");
const CACHE = join(homedir(), ".codex", "plugins", "cache", "fusengine-codex");

async function exists(p: string): Promise<boolean> {
	try { await stat(p); return true; } catch { return false; }
}

async function walkToml(root: string, out: string[] = []): Promise<string[]> {
	if (!(await exists(root))) return out;
	for (const e of await readdir(root, { withFileTypes: true })) {
		const p = join(root, e.name);
		if (e.isDirectory()) await walkToml(p, out);
		else if (e.name.endsWith(".toml") && p.includes("/agents/")) out.push(p);
	}
	return out;
}

function convert(src: string): string {
	return src.replace(/(\w+)\s*=\s*"""([\s\S]*?)"""/g, (_, key, body) => `${key} = '''${body}'''`);
}

async function fixRoot(root: string, label: string): Promise<void> {
	let n = 0;
	for (const path of await walkToml(root)) {
		const src = await Bun.file(path).text();
		if (!src.includes('"""')) continue;
		const next = convert(src);
		if (next !== src) { await Bun.write(path, next); n++; }
	}
	console.log(`[${label}] converted ${n} TOML file(s)`);
}

await fixRoot(REPO, "repo");
await fixRoot(CACHE, "cache");
console.log("Done. Restart Codex.");
