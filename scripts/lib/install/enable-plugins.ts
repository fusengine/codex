/**
 * enable-plugins.ts — Auto-enable all marketplace plugins in config.toml
 * Workaround for Codex 0.130.x where `codex plugin add` is unavailable.
 * Format confirmed in production: [plugins."NAME@MARKETPLACE"] enabled = true
 */
import { join } from "node:path";
import { readdir } from "node:fs/promises";

export async function enableAllPlugins(
	projectRoot: string,
	codexHome: string,
	marketplaceName: string,
): Promise<number> {
	const pluginsRoot = join(projectRoot, "plugins");
	const names: string[] = [];
	for (const e of await readdir(pluginsRoot, { withFileTypes: true })) {
		if (!e.isDirectory() || e.name.startsWith(".") || e.name === "_shared") continue;
		const manifest = Bun.file(join(pluginsRoot, e.name, ".codex-plugin", "plugin.json"));
		if (await manifest.exists()) names.push(e.name);
	}

	const configPath = join(codexHome, "config.toml");
	const file = Bun.file(configPath);
	const cfg = (await file.exists()) ? await file.text() : "";

	let added = 0;
	const blocks: string[] = [];
	for (const name of names) {
		const key = `${name}@${marketplaceName}`;
		const escaped = key.replace(/[.+*]/g, "\\$&");
		if (new RegExp(`\\[plugins\\."${escaped}"\\]`).test(cfg)) continue;
		blocks.push(`\n[plugins."${key}"]\nenabled = true`);
		added++;
	}

	if (added > 0) {
		await Bun.write(configPath, cfg.trimEnd() + "\n" + blocks.join("\n") + "\n");
	}
	return added;
}
