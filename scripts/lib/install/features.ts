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

export async function ensureFeaturesEnabled(codexHome: string): Promise<void> {
	await mkdir(codexHome, { recursive: true });
	const configPath = join(codexHome, "config.toml");
	const file = Bun.file(configPath);
	const existing = (await file.exists()) ? await file.text() : "";

	let next: string;
	if (/^\s*\[features\]/m.test(existing)) {
		next = addLine(existing, "hooks = true");
		next = addLine(next, "plugin_hooks = true");
	} else {
		next = existing.trimEnd() + "\n\n[features]\nhooks = true\nplugin_hooks = true\n";
	}
	if (next !== existing) await Bun.write(configPath, next);
}
