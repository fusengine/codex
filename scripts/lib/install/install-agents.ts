/**
 * install-agents.ts — Install plugin agents into ~/.codex/agents/.
 * Codex CLI 0.130.x ne charge pas agents bundlés (issue openai/codex#18988).
 * Doc: developers.openai.com/codex/subagents — custom agents = TOML standalone
 * sous ~/.codex/agents/ (perso) ou .codex/agents/ (projet).
 */
import { join } from "node:path";
import { materializeAgentFiles } from "./agent-materializer";
import { listPluginFiles } from "./plugin-file-discovery";
import { symlinkPluginFiles } from "./plugin-file-symlinks";

export async function installAgents(
	codexHome: string,
	pluginsRoot: string,
	opts: { quiet?: boolean } = {},
): Promise<void> {
	const agents = await listPluginFiles(pluginsRoot, "agents", ".toml");
	await materializeAgentFiles(agents, pluginsRoot, join(codexHome, "agents"), opts);
}

export async function installCommands(
	codexHome: string,
	pluginsRoot: string,
	opts: { quiet?: boolean } = {},
): Promise<void> {
	const commands = await listPluginFiles(pluginsRoot, "commands", ".md");
	await symlinkPluginFiles(commands, join(codexHome, "prompts"), "command", opts);
}
