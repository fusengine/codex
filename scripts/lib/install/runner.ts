/** runner.ts — Orchestrates Codex setup steps (developers.openai.com/codex). */
import { lstat } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { hasCodexCli, addMarketplace } from "./codex-cli";
import { writeMarketplaceFallback } from "./marketplace-fallback";
import { installAgentsMd } from "./agents-md";
import { mergeAgentsMd } from "./merge-agents-md";
import { ensureFeaturesEnabled } from "./features";
import { promptCodexConfig } from "./config-prompt";
import { installAgents } from "./install-agents";
import { configureShellAutoLoad } from "./shell-install";
import { backupConfig } from "./backup";
import { scanAndPrepare } from "./setup-plugins";
import { promptPerfEnv } from "./perf-env";
import { promptHarnessEnv } from "./harness-env";
import { scanPlugins } from "./plugin-scanner";
import { reportMcp } from "./mcp";
import { runMcpStep } from "./runner-finalize";
import { installPluginsStrict } from "./plugin-install";
import { installRuntimeDeps } from "./runtime-deps";
import { cleanupDeprecatedCodexFlags } from "./cleanup-deprecated-flags";
import { assertInstalledState, inspectInstalledState, summarizeInstalledState } from "./installed-state";

export interface SetupOptions {
	projectRoot: string;
	codexHome: string;
	marketplaceName: string;
	skipPluginInstall: boolean;
}

async function pathExists(path: string): Promise<boolean> {
	try { await lstat(path); return true; } catch { return false; }
}

async function isMarketplaceRegistered(opts: SetupOptions): Promise<boolean> {
	const path = join(opts.codexHome, "config.toml");
	const file = Bun.file(path);
	if (!(await file.exists())) return false;
	const src = await file.text();
	return new RegExp(`^\\[marketplaces\\.${opts.marketplaceName}\\]`, "m").test(src);
}

async function registerMarketplace(opts: SetupOptions): Promise<"cli" | "config"> {
	const s = p.spinner();
	s.start("Registering marketplace…");
	if (await isMarketplaceRegistered(opts)) {
		s.stop(`Marketplace '${opts.marketplaceName}' already registered — skipping add`);
		return (await hasCodexCli()) ? "cli" : "config";
	}
	if (await hasCodexCli()) {
		await addMarketplace(opts.projectRoot);
		s.stop("Marketplace registered via codex CLI");
		return "cli";
	}
	await writeMarketplaceFallback(opts);
	s.stop("Marketplace written to config.toml (codex CLI not found)");
	return "config";
}

function reportInstalledState(opts: SetupOptions): void {
	const states = inspectInstalledState(opts.projectRoot, opts.codexHome, opts.marketplaceName);
	const summary = summarizeInstalledState(states);
	p.log.info(`Installed state: current=${summary.current}, missing=${summary.missing}, stale=${summary.stale}, broken=${summary.broken}`);
	for (const state of states.filter((item) => item.status !== "current").slice(0, 8)) {
		p.log.warn(`${state.name}: ${state.status} (${state.reasons.join("; ")})`);
	}
}

export async function runCodexSetup(opts: SetupOptions): Promise<void> {
	await backupConfig(opts.codexHome);
	cleanupDeprecatedCodexFlags(opts.codexHome);
	await scanAndPrepare(join(opts.projectRoot, "plugins"));
	await installRuntimeDeps(opts.projectRoot, opts.codexHome);
	const mode = await registerMarketplace(opts);
	reportInstalledState(opts);
	await ensureFeaturesEnabled(opts.codexHome);
	await installAgentsMd(join(opts.projectRoot, "AGENTS.md"), join(opts.codexHome, "AGENTS.md"));
	// Runs AFTER installAgentsMd, not right after installRuntimeDeps: installAgentsMd can
	// overwrite AGENTS.md wholesale (user confirms "yes" on the overwrite prompt), which would
	// wipe a rules section merged before it. Merging last guarantees it's never clobbered.
	await mergeAgentsMd(opts.projectRoot, opts.codexHome);
	await installPluginsStrict(opts, mode);
	if (!opts.skipPluginInstall) {
		assertInstalledState(opts.projectRoot, opts.codexHome, opts.marketplaceName);
		p.log.success("plugin installation verified");
	}
	const cachedPluginsRoot = join(opts.codexHome, "plugins", "cache", opts.marketplaceName);
	await installAgents(opts.codexHome, (await pathExists(cachedPluginsRoot)) ? cachedPluginsRoot : join(opts.projectRoot, "plugins"));
	await promptCodexConfig(opts.codexHome);
	await configureShellAutoLoad();
	await promptPerfEnv(opts.codexHome);
	await promptHarnessEnv(opts.codexHome);
	await runMcpStep(opts.codexHome, join(opts.projectRoot, "plugins"));
	await reportMcp(join(opts.projectRoot, "plugins"));
	const plugins = scanPlugins(join(opts.projectRoot, "plugins"));
	p.log.info(`Scanned ${plugins.length} plugins`);
}
