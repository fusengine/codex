/**
 * marketplace-fallback.ts — When codex CLI is unavailable, declare the
 * marketplace by appending a [marketplaces.NAME] table to ~/.codex/config.toml.
 * Reference: developers.openai.com/codex/config-reference, issue #17087.
 */
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import type { SetupOptions } from "./runner";

const HEADER_RE = /^\s*\[marketplaces\.([\w-]+)\]/m;

export async function writeMarketplaceFallback(opts: SetupOptions): Promise<void> {
	await mkdir(opts.codexHome, { recursive: true });
	const configPath = join(opts.codexHome, "config.toml");
	const file = Bun.file(configPath);
	const existing = (await file.exists()) ? await file.text() : "";

	const block = [
		"",
		`[marketplaces.${opts.marketplaceName}]`,
		`source_type = "local"`,
		`source = "${opts.projectRoot}"`,
		`last_updated = "${new Date().toISOString()}"`,
		"",
	].join("\n");

	const blockRe = new RegExp(`\\[marketplaces\\.${opts.marketplaceName}\\][\\s\\S]*?(?=\\n\\[|$)`);
	let next: string;
	if (blockRe.test(existing)) {
		next = existing.replace(blockRe, block.trim());
	} else if (HEADER_RE.test(existing)) {
		next = existing + block;
	} else {
		next = existing + block;
	}
	await Bun.write(configPath, next);
}
