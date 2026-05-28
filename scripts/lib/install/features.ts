/**
 * features.ts — Ensure plugin hooks are enabled in ~/.codex/config.toml.
 * Codex defaults plugin_hooks=false; without it, plugin-bundled hooks never run.
 * Reference: developers.openai.com/codex/config-basic#feature-flags
 */
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

function setFeature(block: string, key: string, value: string): string {
	const line = `${key} = ${value}`;
	const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
	if (pattern.test(block)) return block.replace(pattern, line);
	return block.replace(/^(\[features\])/m, `$1\n${line}`);
}

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
	if (/^\s*\[features\]/m.test(next)) {
		next = setFeature(next, "hooks", "true");
		next = setFeature(next, "plugin_hooks", "true");
	} else {
		next = next.trimEnd() + "\n\n[features]\nhooks = true\nplugin_hooks = true\n";
	}
	next = ensureRootKey(next, "suppress_unstable_features_warning", "true");
	// Plugin-bundled hooks are re-synced/updated across versions; persisting
	// bypass_hook_trust avoids an interactive re-trust prompt each time a hook
	// changes (these hooks are first-party and vetted by this installer).
	next = ensureRootKey(next, "bypass_hook_trust", "true");
	if (next !== existing) await Bun.write(configPath, next);
}
