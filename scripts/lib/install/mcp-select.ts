/**
 * mcp-select.ts — Interactive multi-select for MCP servers.
 */
import * as p from "@clack/prompts";
import { MCP_CATALOG, type McpMeta } from "./mcp-catalog";
import { loadEnvFile } from "./env-file";

function hasKey(env: Record<string, string>, meta: McpMeta): boolean {
	if (!meta.requiresApiKey || !meta.apiKeyEnv) return true;
	return !!env[meta.apiKeyEnv];
}

function buildOptions(env: Record<string, string>, available: string[]) {
	return available
		.filter((name) => MCP_CATALOG[name])
		.map((name) => {
			const meta = MCP_CATALOG[name];
			const keyStatus = meta.requiresApiKey ? (hasKey(env, meta) ? "✓ key" : "⚠ no key") : "no key needed";
			return { value: name, label: `${name} [${keyStatus}]`, hint: meta.description };
		});
}

function buildDefaults(env: Record<string, string>, available: string[]): string[] {
	return available.filter((name) => {
		const meta = MCP_CATALOG[name];
		if (!meta) return false;
		if (meta.default === true) return true;
		if (meta.default === false) return false;
		return !meta.requiresApiKey || hasKey(env, meta);
	});
}

export async function selectMcpServers(codexHome: string, available: string[]): Promise<Set<string>> {
	const env = loadEnvFile(codexHome);
	const options = buildOptions(env, available);
	const defaults = buildDefaults(env, available);
	if (options.length === 0) return new Set();
	const picked = await p.multiselect({
		message: "Select MCP servers to enable in ~/.codex/config.toml:",
		options,
		initialValues: defaults,
		required: false,
	});
	if (p.isCancel(picked)) {
		p.log.warn("Selection cancelled — enabling defaults only");
		return new Set(defaults);
	}
	return new Set(picked as string[]);
}
