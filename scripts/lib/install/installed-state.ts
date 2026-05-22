/**
 * installed-state.ts - Inspect Fusengine plugin installation state without
 * mutating the user's Codex home.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export type InstallStatus = "current" | "missing" | "stale" | "broken";

export interface InstalledPluginState {
	name: string;
	sourceVersion: string;
	cacheVersions: string[];
	cacheVersion?: string;
	enabled: boolean;
	cacheExists: boolean;
	hooksCount: number;
	runtimeSharedOk: boolean;
	status: InstallStatus;
	reasons: string[];
}

interface PluginManifest {
	version?: string;
}

interface HookEntry {
	hooks?: Array<{ command?: string }>;
}

interface HooksConfig {
	hooks?: Record<string, HookEntry[]>;
}

function readText(path: string): string {
	try {
		return readFileSync(path, "utf8");
	} catch {
		return "";
	}
}

function sourcePluginNames(projectRoot: string): string[] {
	const pluginsRoot = join(projectRoot, "plugins");
	if (!existsSync(pluginsRoot)) return [];
	return readdirSync(pluginsRoot)
		.filter((name) => {
			const dir = join(pluginsRoot, name);
			return !name.startsWith(".")
				&& name !== "_shared"
				&& statSync(dir).isDirectory()
				&& existsSync(join(dir, ".codex-plugin", "plugin.json"));
		})
		.sort((a, b) => a.localeCompare(b));
}

function sourceVersion(projectRoot: string, name: string): string {
	const manifestPath = join(projectRoot, "plugins", name, ".codex-plugin", "plugin.json");
	try {
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PluginManifest;
		return manifest.version ?? "0.0.0";
	} catch {
		return "0.0.0";
	}
}

function cacheVersions(codexHome: string, marketplaceName: string, name: string): string[] {
	const root = join(codexHome, "plugins", "cache", marketplaceName, name);
	if (!existsSync(root)) return [];
	return readdirSync(root)
		.filter((version) => {
			const dir = join(root, version);
			return statSync(dir).isDirectory();
		})
		.sort((a, b) => a.localeCompare(b));
}

function enabledPlugins(codexHome: string): Set<string> {
	const config = readText(join(codexHome, "config.toml"));
	const enabled = new Set<string>();
	const blockRe = /^\s*\[plugins\."([^\"]+)"\][\s\S]*?(?=^\s*\[|\z)/gm;
	for (const match of config.matchAll(blockRe)) {
		const block = match[0];
		if (/^\s*enabled\s*=\s*true\s*$/m.test(block)) enabled.add(match[1]);
	}
	return enabled;
}

function countHooks(pluginRoot: string): number {
	const hooksPath = join(pluginRoot, "hooks", "hooks.json");
	if (!existsSync(hooksPath)) return 0;
	try {
		const config = JSON.parse(readFileSync(hooksPath, "utf8")) as HooksConfig;
		return Object.values(config.hooks ?? {})
			.flat()
			.reduce((count, entry) => count + (entry.hooks?.length ?? 0), 0);
	} catch {
		return 0;
	}
}

function runtimeSharedOk(codexHome: string): boolean {
	const root = join(codexHome, "fusengine-sys", "shared", "scripts");
	return existsSync(join(root, "edit_targets.py"))
		&& existsSync(join(root, "check_skill_common.py"))
		&& existsSync(join(root, "hook_output.py"));
}

function statusFor(args: {
	sourceVersion: string;
	cacheVersion?: string;
	enabled: boolean;
	cacheExists: boolean;
	runtimeSharedOk: boolean;
}): { status: InstallStatus; reasons: string[] } {
	const reasons: string[] = [];
	if (!args.enabled) reasons.push("not enabled");
	if (!args.cacheExists) reasons.push("cache missing");
	if (args.cacheExists && args.cacheVersion !== args.sourceVersion) {
		reasons.push(`cache version ${args.cacheVersion ?? "unknown"} != source ${args.sourceVersion}`);
	}
	if (!args.runtimeSharedOk) reasons.push("runtime shared missing");
	if (reasons.length === 0) return { status: "current", reasons };
	if (!args.cacheExists || !args.enabled) return { status: "missing", reasons };
	if (!args.runtimeSharedOk) return { status: "broken", reasons };
	return { status: "stale", reasons };
}

export function inspectInstalledState(
	projectRoot: string,
	codexHome: string,
	marketplaceName: string,
): InstalledPluginState[] {
	const enabled = enabledPlugins(codexHome);
	const sharedOk = runtimeSharedOk(codexHome);
	return sourcePluginNames(projectRoot).map((name) => {
		const version = sourceVersion(projectRoot, name);
		const versions = cacheVersions(codexHome, marketplaceName, name);
		const cacheVersion = versions.includes(version) ? version : versions.at(-1);
		const cacheRoot = cacheVersion
			? join(codexHome, "plugins", "cache", marketplaceName, name, cacheVersion)
			: "";
		const cacheExists = cacheVersion !== undefined && existsSync(cacheRoot);
		const pluginEnabled = enabled.has(`${name}@${marketplaceName}`);
		const status = statusFor({
			sourceVersion: version,
			cacheVersion,
			enabled: pluginEnabled,
			cacheExists,
			runtimeSharedOk: sharedOk,
		});
		return {
			name,
			sourceVersion: version,
			cacheVersions: versions,
			cacheVersion,
			enabled: pluginEnabled,
			cacheExists,
			hooksCount: cacheExists ? countHooks(cacheRoot) : countHooks(join(projectRoot, "plugins", name)),
			runtimeSharedOk: sharedOk,
			status: status.status,
			reasons: status.reasons,
		};
	});
}

export function summarizeInstalledState(states: InstalledPluginState[]): Record<InstallStatus, number> {
	return states.reduce<Record<InstallStatus, number>>((summary, state) => {
		summary[state.status]++;
		return summary;
	}, { current: 0, missing: 0, stale: 0, broken: 0 });
}
