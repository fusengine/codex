/**
 * runner-finalize.ts — MCP installation step extracted from runner.ts.
 * SRP: interactive catalog selection + write-to-config.toml only.
 * Kept separate so runner.ts stays the pure orchestrator.
 */
import { selectMcpServers } from "./mcp-select";
import { MCP_CATALOG } from "./mcp-catalog";
import { configureMcpServers } from "./mcp-configurator";
import { promptMissingKeys } from "./mcp-key-prompt";

/**
 * Select MCP servers, prompt ONLY for keys needed by the selection,
 * then wire the result into ~/.codex/config.toml (resolving ${VAR}s).
 */
export async function runMcpStep(codexHome: string, pluginsDir: string): Promise<void> {
	const available = Object.keys(MCP_CATALOG);
	const selected = await selectMcpServers(codexHome, available);
	if (selected.size === 0) return;
	await promptMissingKeys(codexHome, selected);
	await configureMcpServers(codexHome, pluginsDir, selected);
}
