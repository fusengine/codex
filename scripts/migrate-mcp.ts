#!/usr/bin/env bun
/**
 * migrate-mcp.ts — Convert Claude-style mcp.json.bak files to Codex-format
 * .mcp.json files, then re-link them from each plugin's manifest.
 *
 * Codex format (PR #18780):
 *   - Wrapper: `mcp_servers` (snake_case) OR direct map (no wrapper)
 *   - No `type` field required (inferred from command/url)
 *   - `headers` → `http_headers`
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const SRC_ROOT = "/Users/brunoazoulay/Labo/docker-lab/dev.local/Dev-ai/codex/claude-plugins/plugins";
const DEST_ROOT = join(import.meta.dir, "..", "plugins");

interface ClaudeServer {
	command?: string;
	args?: string[];
	env?: Record<string, string>;
	url?: string;
	headers?: Record<string, string>;
	type?: string;
}

function toCodexServer(s: ClaudeServer): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	if (s.command) out.command = s.command;
	if (s.args) out.args = s.args;
	if (s.env) out.env = s.env;
	if (s.url) out.url = s.url;
	if (s.headers) out.http_headers = s.headers;
	return out;
}

async function main() {
	let converted = 0;
	let linked = 0;
	for (const e of await readdir(DEST_ROOT, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		const bak = join(SRC_ROOT, e.name, "mcp.json.bak");
		const bakFile = Bun.file(bak);
		if (!(await bakFile.exists())) continue;
		const raw = JSON.parse(await bakFile.text());
		const claudeServers: Record<string, ClaudeServer> = raw.mcpServers ?? raw.mcp_servers ?? raw;
		const codex: Record<string, Record<string, unknown>> = {};
		for (const [name, srv] of Object.entries(claudeServers)) {
			codex[name] = toCodexServer(srv);
		}
		const dest = join(DEST_ROOT, e.name, ".mcp.json");
		await Bun.write(dest, JSON.stringify(codex, null, 2));
		converted++;
		const manifest = join(DEST_ROOT, e.name, ".codex-plugin", "plugin.json");
		const data = JSON.parse(await Bun.file(manifest).text());
		if (data.mcpServers !== "./.mcp.json") {
			data.mcpServers = "./.mcp.json";
			await Bun.write(manifest, JSON.stringify(data, null, 2));
			linked++;
		}
	}
	console.log(`[OK] ${converted} .mcp.json created, ${linked} manifests re-linked`);
}

if (import.meta.main) await main();
