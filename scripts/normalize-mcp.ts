#!/usr/bin/env bun
/**
 * normalize-mcp.ts — Rewrite plugin .mcp.json files so each server uses the
 * env var names it actually reads, drops CLI-flag key passing, and switches
 * Exa HTTP to env_http_headers.x-api-key. Run once after migrate.ts.
 */
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const PLUGINS = join(ROOT, "plugins");

interface Srv {
	command?: string;
	args?: string[];
	env?: Record<string, string>;
	url?: string;
	http_headers?: Record<string, string>;
	env_http_headers?: Record<string, string>;
}

function normalize(name: string, s: Srv): Srv {
	if (name === "gemini-design") {
		return { command: s.command, args: s.args, env: { API_KEY: "${GEMINI_DESIGN_API_KEY}" } };
	}
	if (name === "magic") {
		const args = (s.args ?? []).filter((a) => !/^API_KEY=/.test(a) && !/\$\{MAGIC_API_KEY\}/.test(a));
		return { command: s.command, args, env: { API_KEY: "${MAGIC_API_KEY}" } };
	}
	if (name === "context7") {
		const args = (s.args ?? []).filter((a, i, arr) => a !== "--api-key" && arr[i - 1] !== "--api-key");
		return { command: s.command, args, env: { CONTEXT7_API_KEY: "${CONTEXT7_API_KEY}" } };
	}
	if (name === "exa") {
		const url = (s.url ?? "").replace(/[?&]exaApiKey=\$\{EXA_API_KEY\}/, "");
		return { url: url.replace(/[?&]$/, ""), env_http_headers: { "x-api-key": "${EXA_API_KEY}" } };
	}
	return s;
}

async function main(): Promise<void> {
	let touched = 0;
	for (const e of await readdir(PLUGINS, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		const path = join(PLUGINS, e.name, ".mcp.json");
		const file = Bun.file(path);
		if (!(await file.exists())) continue;
		const cfg = (await file.json()) as Record<string, Srv>;
		const next: Record<string, Srv> = {};
		for (const [name, srv] of Object.entries(cfg)) next[name] = normalize(name, srv);
		await Bun.write(path, `${JSON.stringify(next, null, 2)}\n`);
		touched++;
		console.log(`✓ ${e.name}/.mcp.json`);
	}
	console.log(`\nNormalized ${touched} files`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
