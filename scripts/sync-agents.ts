#!/usr/bin/env bun
/**
 * sync-agents.ts — Fast-path resync of agents and commands only.
 * Propague les edits de plugins/*\/agents/*.toml et plugins/*\/commands/*.md
 * vers $CODEX_HOME sans relancer le setup complet (runtime deps, config.toml,
 * MCP, hooks trust). Doc: developers.openai.com/codex/subagents.
 */
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import * as p from "@clack/prompts";
import { installAgents, installCommands } from "./lib/install/install-agents";

const PROJECT_ROOT = dirname(import.meta.dir);
const CODEX_HOME = process.env.CODEX_HOME || join(homedir(), ".codex");

/**
 * Resync agents and commands into CODEX_HOME.
 *
 * @returns Promise resolved when both syncs completed
 */
async function main(): Promise<void> {
	const quiet = process.argv.includes("--quiet");
	p.intro(`Fusengine Codex Sync (agents + commands → ${CODEX_HOME})`);
	const pluginsRoot = join(PROJECT_ROOT, "plugins");
	await installAgents(CODEX_HOME, pluginsRoot, { quiet });
	await installCommands(CODEX_HOME, pluginsRoot, { quiet });
	p.outro("Sync complete. Restart Codex CLI to apply.");
}

main().catch((e: Error) => {
	p.log.error(e.message);
	process.exit(1);
});
