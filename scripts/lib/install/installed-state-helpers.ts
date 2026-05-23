import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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

export function sourcePluginNames(projectRoot: string): string[] {
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

export function sourceVersion(projectRoot: string, name: string): string {
	const manifestPath = join(projectRoot, "plugins", name, ".codex-plugin", "plugin.json");
	try {
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PluginManifest;
		return manifest.version ?? "0.0.0";
	} catch {
		return "0.0.0";
	}
}

export function cacheVersions(codexHome: string, marketplaceName: string, name: string): string[] {
	const root = join(codexHome, "plugins", "cache", marketplaceName, name);
	if (!existsSync(root)) return [];
	return readdirSync(root)
		.filter((version) => {
			const dir = join(root, version);
			return statSync(dir).isDirectory();
		})
		.sort((a, b) => a.localeCompare(b));
}

export function enabledPlugins(codexHome: string): Set<string> {
	const config = readText(join(codexHome, "config.toml"));
	const enabled = new Set<string>();
	const blockRe = /^\s*\[plugins\."([^\"]+)"\][\s\S]*?(?=^\s*\[|(?![\s\S]))/gm;
	for (const match of config.matchAll(blockRe)) {
		const block = match[0];
		if (/^\s*enabled\s*=\s*true\s*$/m.test(block)) enabled.add(match[1]);
	}
	return enabled;
}

export function countHooks(pluginRoot: string): number {
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

export function runtimeSharedOk(codexHome: string): boolean {
	const root = join(codexHome, "fusengine-sys", "shared", "scripts");
	return existsSync(join(root, "edit_targets.py"))
		&& existsSync(join(root, "check_skill_common.py"))
		&& existsSync(join(root, "hook_output.py"));
}
