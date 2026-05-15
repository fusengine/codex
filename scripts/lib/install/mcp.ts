/**
 * mcp.ts — Verify plugin-scoped MCP servers are wired and report missing
 * environment variables ${API_KEY} so the user knows what to export before
 * the next Codex session. Plugin .mcp.json files are loaded by Codex
 * automatically at plugin enable; we only validate and report.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";

interface ServerCfg {
	command?: string;
	args?: string[];
	env?: Record<string, string>;
	url?: string;
	http_headers?: Record<string, string>;
}

function collectVars(value: unknown, out: Set<string>): void {
	if (typeof value === "string") {
		for (const m of value.matchAll(/\$\{([A-Z_][A-Z0-9_]*)\}/g)) out.add(m[1]);
	} else if (Array.isArray(value)) {
		for (const v of value) collectVars(v, out);
	} else if (value && typeof value === "object") {
		for (const v of Object.values(value)) collectVars(v, out);
	}
}

export async function reportMcp(pluginsRoot: string): Promise<void> {
	const servers = new Map<string, string[]>();
	const requiredVars = new Set<string>();
	for (const e of await readdir(pluginsRoot, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		const mcp = Bun.file(join(pluginsRoot, e.name, ".mcp.json"));
		if (!(await mcp.exists())) continue;
		const cfg = (await mcp.json()) as Record<string, ServerCfg>;
		for (const [name, srv] of Object.entries(cfg)) {
			if (!servers.has(name)) servers.set(name, []);
			servers.get(name)?.push(e.name);
			collectVars(srv, requiredVars);
		}
	}
	if (servers.size === 0) {
		p.log.info("No plugin-scoped MCP servers found.");
		return;
	}
	const lines = [`${servers.size} MCP servers bundled across plugins:`];
	for (const [name, plugins] of servers) {
		lines.push(`  - ${name} (used by ${plugins.length} plugin${plugins.length > 1 ? "s" : ""})`);
	}
	p.log.success(lines.join("\n"));

	const missing = [...requiredVars].filter((v) => !process.env[v]);
	if (missing.length > 0) {
		p.log.warn(
			`Missing env vars for MCP servers — export these before starting Codex:\n  ${missing.map((v) => `export ${v}="..."`).join("\n  ")}`,
		);
	} else if (requiredVars.size > 0) {
		p.log.success(`All ${requiredVars.size} required MCP env vars are set.`);
	}
}
