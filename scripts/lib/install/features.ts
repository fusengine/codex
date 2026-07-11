/**
 * features.ts — Ensure required Codex features are enabled in config.toml.
 * Reference: developers.openai.com/codex/config-basic#feature-flags
 */
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import * as p from "@clack/prompts";
import { hasKey } from "./toml-helpers";
import { hasTableKey, removeRootKey, removeTableKey, setTableKey } from "./toml-table-helpers";

function ensureRootKey(src: string, key: string, value: string): string {
	if (new RegExp(`^${key}\\s*=`, "m").test(src)) return src;
	return `${key} = ${value}\n${src}`;
}

export async function ensureFeaturesEnabled(codexHome: string): Promise<void> {
	await mkdir(codexHome, { recursive: true });
	const configPath = join(codexHome, "config.toml");
	const file = Bun.file(configPath);
	const existing = (await file.exists()) ? await file.text() : "";

	let next = existing.replace(/^\s*codex_hooks\s*=.*\n?/gm, "");
	next = removeRootKey(next, "features.multi_agent_v2");
	next = removeRootKey(next, "features.plugin_hooks");
	next = removeRootKey(next, "agents.max_threads");
	next = removeTableKey(next, "features", "multi_agent_v2");
	next = removeTableKey(next, "features", "plugin_hooks");
	next = removeTableKey(next, "agents", "max_threads");
	next = setTableKey(next, "features", "hooks", "true");
	next = setTableKey(next, "features", "multi_agent", "true");
	next = setTableKey(next, "features.multi_agent_v2", "enabled", "true");
	next = setTableKey(next, "features.multi_agent_v2", "tool_namespace", '"fusengine_agents"');
	next = setTableKey(next, "features.multi_agent_v2", "hide_spawn_agent_metadata", "false");
	if (!hasTableKey(next, "features.multi_agent_v2", "max_concurrent_threads_per_session")) {
		next = setTableKey(next, "features.multi_agent_v2", "max_concurrent_threads_per_session", "4");
	}
	next = ensureRootKey(next, "suppress_unstable_features_warning", "true");
	if (!hasKey(next, "bypass_hook_trust")) {
		const wants = await p.confirm({
			message: "Skip Codex's native re-confirmation prompt whenever a plugin hook changes? (writes bypass_hook_trust = true — disables that safety check)",
			initialValue: false,
		});
		if (!p.isCancel(wants) && wants) next = ensureRootKey(next, "bypass_hook_trust", "true");
	}
	if (next !== existing) await Bun.write(configPath, next);
}
