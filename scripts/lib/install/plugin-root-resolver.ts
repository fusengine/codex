import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { compareVersionsDesc, pathExists } from "./plugin-file-discovery";

async function resolvePluginRoot(pluginsRoot: string, plugin: string): Promise<string | undefined> {
	const root = join(pluginsRoot, plugin);
	if (await pathExists(join(root, ".codex-plugin")) || await pathExists(join(root, "skills"))) return root;
	const versions = (await readdir(root, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
		.map((entry) => entry.name)
		.sort(compareVersionsDesc);
	return versions[0] ? join(root, versions[0]) : undefined;
}

export async function buildPluginRoots(pluginsRoot: string): Promise<Map<string, string>> {
	const roots = new Map<string, string>();
	for (const entry of await readdir(pluginsRoot, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "_shared") continue;
		const root = await resolvePluginRoot(pluginsRoot, entry.name);
		if (root) roots.set(entry.name, root);
	}
	return roots;
}
