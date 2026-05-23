import * as p from "@clack/prompts";
import { addPlugin, listPlugins, supportsPluginAdd } from "./codex-cli";
import { enableAllPlugins } from "./enable-plugins";
import { installPluginCache } from "./plugin-cache";
import type { SetupOptions } from "./runner";

export async function installPluginsStrict(opts: SetupOptions, mode: "cli" | "config"): Promise<void> {
	if (opts.skipPluginInstall) return;
	if (mode !== "cli" || !(await supportsPluginAdd())) {
		const cached = await installPluginCache(opts.projectRoot, opts.codexHome, opts.marketplaceName);
		const added = await enableAllPlugins(opts.projectRoot, opts.codexHome, opts.marketplaceName);
		p.log.success(`cached ${cached} plugins and enabled ${added} config entries`);
		return;
	}

	const failures: string[] = [];
	for (const name of await listPlugins(opts.projectRoot)) {
		try {
			await addPlugin(name, opts.marketplaceName);
			p.log.success(`installed ${name}`);
		} catch (e) {
			failures.push(`${name}: ${(e as Error).message}`);
		}
	}
	if (failures.length > 0) {
		throw new Error(`Codex plugin installation failed:\n${failures.join("\n")}`);
	}
}
