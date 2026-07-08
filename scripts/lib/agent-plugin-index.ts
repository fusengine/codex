import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function buildSkillIndex(pluginsRoots: string[]): Promise<Map<string, string[]>> {
	const index = new Map<string, string[]>();
	for (const root of pluginsRoots) {
		for (const plugin of await safeReaddir(root)) {
			for (const skillName of await readSkillNames(join(root, plugin, "skills"))) {
				const owners = index.get(skillName) ?? [];
				if (!owners.includes(plugin)) owners.push(plugin);
				index.set(skillName, owners);
			}
		}
	}
	return index;
}

export async function buildVersionIndex(pluginsRoots: string[]): Promise<Map<string, string>> {
	const index = new Map<string, string>();
	for (const root of pluginsRoots) {
		for (const plugin of await safeReaddir(root)) {
			const pluginDir = join(root, plugin);
			const version = await readManifestVersion(pluginDir) ?? await readCachedVersion(pluginDir);
			if (version && !index.has(plugin)) index.set(plugin, version);
		}
	}
	return index;
}

export async function readSkillNames(skillsDir: string): Promise<string[]> {
	const entries = await safeReaddir(skillsDir);
	return entries.filter((entry) => existsSync(join(skillsDir, entry, "SKILL.md"))).sort();
}

async function readManifestVersion(pluginDir: string): Promise<string | null> {
	for (const relPath of [".codex-plugin/plugin.json", ".claude-plugin/plugin.json"]) {
		try {
			const manifest = JSON.parse(await Bun.file(join(pluginDir, relPath)).text());
			if (manifest.version) return String(manifest.version);
		} catch {
			continue;
		}
	}
	return null;
}

async function readCachedVersion(pluginDir: string): Promise<string | null> {
	const versionDirs = (await safeReaddir(pluginDir))
		.filter((entry) => /^\d+\.\d+\.\d+/.test(entry))
		.sort(compareVersions)
		.reverse();
	for (const versionDir of versionDirs) {
		const manifestVersion = await readManifestVersion(join(pluginDir, versionDir));
		if (manifestVersion) return manifestVersion;
	}
	return versionDirs[0] ?? null;
}

function compareVersions(a: string, b: string): number {
	return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function safeReaddir(path: string): Promise<string[]> {
	try {
		const entries = await readdir(path, { withFileTypes: true });
		return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
	} catch {
		return [];
	}
}
