#!/usr/bin/env bun
/**
 * install-codex.ts — Codex CLI installer entry point.
 * Conforme doc Codex: developers.openai.com/codex/plugins/build,
 * developers.openai.com/codex/cli/reference.
 */
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import * as p from "@clack/prompts";
import { runCodexSetup } from "./lib/install/runner";

const PROJECT_ROOT = dirname(import.meta.dir);
const CODEX_HOME = process.env.CODEX_HOME || join(homedir(), ".codex");

async function main(): Promise<void> {
	p.intro("Fusengine Codex Plugins Setup");
	const skipInstall = process.argv.includes("--skip-install");
	const skipEnv = process.argv.includes("--skip-env");
	await runCodexSetup({
		projectRoot: PROJECT_ROOT,
		codexHome: CODEX_HOME,
		marketplaceName: "fusengine-codex",
		skipPluginInstall: skipInstall,
		skipEnv,
	});
	p.outro("Setup complete. Restart Codex CLI to apply.");
}

main().catch((e) => {
	p.log.error(e.message);
	process.exit(1);
});
