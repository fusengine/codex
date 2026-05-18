#!/usr/bin/env bun
/**
 * adapt-hook-matchers.ts — Map Claude tool names to Codex 0.130 tool names.
 * Codex tool names include Bash, apply_patch, web_search, update_plan,
 * and MCP tool names as mcp__server__tool.
 */
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const REPO = join(ROOT, "plugins");
const CACHE = join(homedir(), ".codex", "plugins", "cache", "fusengine-codex");

const TOKEN_MAP: Record<string, string> = {
	Bash: "Bash", bash: "Bash", shell: "Bash",
	Write: "apply_patch", Edit: "apply_patch", MultiEdit: "apply_patch",
	NotebookEdit: "apply_patch", apply_patch: "apply_patch",
	Read: "", Glob: "", Grep: "", LS: "", Task: "", Agent: "",
	WebSearch: "web_search", WebFetch: "", TodoWrite: "update_plan",
	TaskCreate: "update_plan", TaskUpdate: "update_plan",
	TaskList: "update_plan", TaskGet: "update_plan",
	TaskOutput: "update_plan", TaskStop: "update_plan",
};

function remapToken(tok: string): string {
	const trim = tok.trim();
	if (!trim) return "";
	if (trim === "mcp_tool_call" || trim.startsWith("mcp__")) return "mcp__.*";
	if (trim in TOKEN_MAP) return TOKEN_MAP[trim];
	return trim;
}

function remapMatcher(matcher: string): string {
	const parts = matcher.split("|").map(remapToken).filter((t) => t.length > 0);
	return [...new Set(parts)].join("|");
}

async function exists(p: string): Promise<boolean> {
	try { await stat(p); return true; } catch { return false; }
}

interface HookEntry { matcher?: string; hooks: unknown[] }
interface HooksFile { hooks: Record<string, HookEntry[]> }

function rewriteFile(data: HooksFile): boolean {
	let changed = false;
	for (const events of Object.values(data.hooks ?? {})) {
		for (const entry of events) {
			if (typeof entry.matcher !== "string") continue;
			const next = remapMatcher(entry.matcher);
			if (next !== entry.matcher) { entry.matcher = next; changed = true; }
		}
	}
	return changed;
}

async function walkHooks(root: string): Promise<string[]> {
	const out: string[] = [];
	if (!(await exists(root))) return out;
	for (const e of await readdir(root, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		const dir = join(root, e.name);
		const direct = join(dir, "hooks", "hooks.json");
		if (await exists(direct)) { out.push(direct); continue; }
		for (const v of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
			if (!v.isDirectory()) continue;
			const versioned = join(dir, v.name, "hooks", "hooks.json");
			if (await exists(versioned)) out.push(versioned);
		}
	}
	return out;
}

async function processRoot(root: string, label: string): Promise<void> {
	let n = 0;
	for (const path of await walkHooks(root)) {
		const data = (await Bun.file(path).json()) as HooksFile;
		if (rewriteFile(data)) {
			await Bun.write(path, `${JSON.stringify(data, null, 2)}\n`);
			n++;
		}
	}
	console.log(`[${label}] rewrote ${n} hooks.json file(s)`);
}

await processRoot(REPO, "repo");
await processRoot(CACHE, "cache");
console.log("Done. Restart Codex.");
