/**
 * plugin-scanner.ts — Scan plugins/* for hooks.json + .mcp.json + manifest.
 * Used by runner.ts at end of install for a diagnostic report.
 * SRP: discovery + counting only (no formatting, no I/O beyond fs reads).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface PluginInfo {
	name: string;
	path: string;
	hasManifest: boolean;
	hasHooks: boolean;
	hasMcp: boolean;
	hookEventCount: number;
	hookHandlerCount: number;
	mcpServerCount: number;
	skillCount: number;
	agentCount: number;
}

interface HookEntry {
	matcher?: string;
	hooks: Array<{ type?: string; command: string }>;
}

interface HooksConfig {
	hooks?: Record<string, HookEntry[]>;
}

/** Scan a single plugin directory and return its diagnostic summary. */
function scanPlugin(pluginsDir: string, name: string): PluginInfo {
	const path = join(pluginsDir, name);
	const info: PluginInfo = {
		name,
		path,
		hasManifest: existsSync(join(path, ".codex-plugin/plugin.json"))
			|| existsSync(join(path, ".claude-plugin/plugin.json")),
		hasHooks: false,
		hasMcp: false,
		hookEventCount: 0,
		hookHandlerCount: 0,
		mcpServerCount: 0,
		skillCount: countDirEntries(join(path, "skills")),
		agentCount: countDirEntries(join(path, "agents"), ".toml"),
	};

	const hooksFile = join(path, "hooks/hooks.json");
	if (existsSync(hooksFile)) {
		info.hasHooks = true;
		try {
			const cfg = JSON.parse(readFileSync(hooksFile, "utf8")) as HooksConfig;
			const events = cfg.hooks ?? {};
			info.hookEventCount = Object.keys(events).length;
			info.hookHandlerCount = Object.values(events)
				.flat()
				.reduce((n, entry) => n + (entry.hooks?.length ?? 0), 0);
		} catch {
			/* malformed hooks.json — surfaced via hasHooks=true + 0 counts */
		}
	}

	const mcpFile = join(path, ".mcp.json");
	if (existsSync(mcpFile)) {
		info.hasMcp = true;
		try {
			const cfg = JSON.parse(readFileSync(mcpFile, "utf8")) as Record<string, unknown>;
			info.mcpServerCount = Object.keys(cfg).length;
		} catch {
			/* malformed .mcp.json */
		}
	}

	return info;
}

function countDirEntries(dir: string, suffix?: string): number {
	if (!existsSync(dir) || !statSync(dir).isDirectory()) return 0;
	const entries = readdirSync(dir);
	return suffix ? entries.filter((e) => e.endsWith(suffix)).length : entries.length;
}

/** Scan plugins root and return one PluginInfo per direct child directory. */
export function scanPlugins(pluginsDir: string): PluginInfo[] {
	if (!existsSync(pluginsDir)) return [];
	return readdirSync(pluginsDir)
		.filter((name) => {
			const p = join(pluginsDir, name);
			return existsSync(p) && statSync(p).isDirectory() && !name.startsWith(".");
		})
		.map((name) => scanPlugin(pluginsDir, name))
		.sort((a, b) => a.name.localeCompare(b.name));
}
