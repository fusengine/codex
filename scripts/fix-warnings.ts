#!/usr/bin/env bun
/**
 * fix-warnings.ts — Quote SKILL.md frontmatter + drop dangling manifest refs.
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

async function walkSkills(root: string, out: string[] = []): Promise<string[]> {
	if (!(await exists(root))) return out;
	for (const e of await readdir(root, { withFileTypes: true })) {
		const p = join(root, e.name);
		if (e.isDirectory()) await walkSkills(p, out);
		else if (e.name === "SKILL.md") out.push(p);
	}
	return out;
}

function quoteFrontmatter(src: string): string {
	const m = src.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return src;
	const lines = m[1].split("\n").map((line) => {
		const dm = line.match(/^(description|when-to-use|keywords):\s+(.+)$/);
		if (!dm) return line;
		const [, key, value] = dm;
		if (/^["'].*["']$/.test(value)) return line;
		return `${key}: "${value.replace(/"/g, '\\"')}"`;
	});
	return src.replace(m[0], `---\n${lines.join("\n")}\n---`);
}

async function fixSkills(root: string, label: string): Promise<void> {
	let n = 0;
	for (const path of await walkSkills(root)) {
		const src = await Bun.file(path).text();
		const next = quoteFrontmatter(src);
		if (next !== src) { await Bun.write(path, next); n++; }
	}
	console.log(`[${label}] quoted ${n} SKILL.md`);
}

async function pruneManifest(dir: string): Promise<boolean> {
	const path = join(dir, ".codex-plugin", "plugin.json");
	if (!(await exists(path))) return false;
	const data = JSON.parse(await Bun.file(path).text());
	let changed = false;
	for (const [key, rel] of [["hooks", "hooks/hooks.json"], ["skills", "skills"]]) {
		if (data[key] && !(await exists(join(dir, rel)))) { delete data[key]; changed = true; }
	}
	if (changed) await Bun.write(path, `${JSON.stringify(data, null, 2)}\n`);
	return changed;
}

async function fixManifests(root: string, label: string): Promise<void> {
	let n = 0;
	if (!(await exists(root))) return;
	for (const e of await readdir(root, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		const dir = join(root, e.name);
		if (await exists(join(dir, ".codex-plugin"))) {
			if (await pruneManifest(dir)) n++;
		} else {
			for (const v of await readdir(dir, { withFileTypes: true })) {
				if (v.isDirectory() && (await pruneManifest(join(dir, v.name)))) n++;
			}
		}
	}
	console.log(`[${label}] pruned ${n} manifest(s)`);
}

await fixSkills(REPO, "repo");
await fixManifests(REPO, "repo");
await fixSkills(CACHE, "cache");
await fixManifests(CACHE, "cache");
console.log("Done. Restart Codex CLI.");
