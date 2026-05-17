/**
 * features.ts — Ensure plugin hooks are enabled in ~/.codex/config.toml.
 * Codex defaults plugin_hooks=false; without it, plugin-bundled hooks never run.
 * Reference: developers.openai.com/codex/config-reference
 */
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

function addLine(block: string, line: string): string {
	if (new RegExp(`^${line.split("=")[0].trim()}\\s*=`, "m").test(block)) return block;
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

	let next = existing;
	if (/^\s*\[features\]/m.test(next)) {
		next = addLine(next, "hooks = true");
		next = addLine(next, "plugin_hooks = true");
	} else {
		next = next.trimEnd() + "\n\n[features]\nhooks = true\nplugin_hooks = true\n";
	}
	next = ensureRootKey(next, "suppress_unstable_features_warning", "true");
	if (next !== existing) await Bun.write(configPath, next);
}
