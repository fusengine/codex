import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateHarnessHookWiring } from "./harness-hook-validation";
import { validateHooksConfig } from "./hooks-validation";
import { scanPlugins } from "./install/plugin-scanner";

/** Validate schemas, matchers, local targets, and Harness routing for all plugins. */
export function validateHookConfigs(root: string): void {
	const wiringErrors = validateHarnessHookWiring(root);
	if (wiringErrors.length > 0) throw new Error(wiringErrors.join("\n"));
	for (const plugin of scanPlugins(join(root, "plugins"))) {
		const file = join(plugin.path, "hooks", "hooks.json");
		if (!existsSync(file)) continue;
		const data = JSON.parse(readFileSync(file, "utf8"));
		const configErrors = validateHooksConfig(file, data);
		if (configErrors.length > 0) throw new Error(configErrors.join("\n"));
		for (const entries of Object.values(data.hooks ?? {}) as any[]) for (const entry of entries) {
			if (/mcp_tool_call|^bash$/.test(entry.matcher ?? "")) {
				throw new Error(`${file}: invalid matcher '${entry.matcher}'`);
			}
			for (const hook of entry.hooks ?? []) {
				const match = String(hook.command ?? "").match(/\$\{PLUGIN_ROOT\}\/([^\s"']+)/);
				if (match && !existsSync(join(plugin.path, match[1]))) {
					throw new Error(`${file}: missing hook target ${match[1]}`);
				}
			}
		}
	}
}
