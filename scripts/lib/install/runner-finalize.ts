/**
 * runner-finalize.ts — MCP installation step extracted from runner.ts.
 * SRP: interactive catalog selection + write-to-config.toml only.
 * Kept separate so runner.ts stays the pure orchestrator.
 */
import { selectMcpServers } from "./mcp-select";
import { MCP_CATALOG } from "./mcp-catalog";
import { configureMcpServers } from "./mcp-configurator";

/**
 * Prompt the user to pick MCP servers from the catalog, then wire the
 * selection into ~/.codex/config.toml (resolving plugin .mcp.json ${VAR}s).
 */
export async function runMcpStep(codexHome: string, pluginsDir: string): Promise<void> {
	const available = Object.keys(MCP_CATALOG);
	const selected = await selectMcpServers(codexHome, available);
	await configureMcpServers(codexHome, pluginsDir, selected);
}
