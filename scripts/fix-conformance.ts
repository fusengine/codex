#!/usr/bin/env bun
/**
 * fix-conformance.ts — One-shot Codex doc conformance fixes:
 *   1. marketplace.json: source string → object {source:"local", path}, add policy + category
 *   2. .codex-plugin/plugin.json: align "name" with folder name
 *   3. agents/*.toml: rename non-doc models (gpt-5.3-codex → gpt-5.4, gpt-5.3-codex-mini → gpt-5.4-mini)
 * Sources: developers.openai.com/codex/plugins/build, /subagents
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const PLUGINS_DIR = join(ROOT, "plugins");
const MARKETPLACE = join(ROOT, ".agents", "plugins", "marketplace.json");

const CATEGORY_OF: Record<string, string> = {
	"ai-pilot": "Productivity",
	"astro-expert": "Framework",
	"cartographer": "Productivity",
	"changelog-watcher": "Productivity",
	"codex-rules": "Productivity",
	"commit-pro": "Productivity",
	"core-guards": "Security",
	"design-expert": "Design",
	"laravel-expert": "Framework",
	"memory-neural": "Productivity",
	"nextjs-expert": "Framework",
	"prompt-engineer": "Productivity",
	"react-expert": "Framework",
	"security-expert": "Security",
	"seo": "Marketing",
	"shadcn-expert": "Framework",
	"solid": "Productivity",
	"swift-apple-expert": "Framework",
	"tailwindcss": "Framework",
};

async function fixMarketplace() {
	const data = JSON.parse(await Bun.file(MARKETPLACE).text());
	data.interface = data.interface ?? { displayName: "Fusengine Codex Plugins" };
	data.plugins = data.plugins.map((p: { name: string; source: string; version: string }) => {
		const folder = p.source.replace(/^\.\/plugins\//, "");
		return {
			name: p.name,
			source: { source: "local", path: p.source },
			version: p.version,
			category: CATEGORY_OF[folder] ?? "Productivity",
			policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
		};
	});
	await Bun.write(MARKETPLACE, JSON.stringify(data, null, 2));
	console.log(`[OK] marketplace.json: ${data.plugins.length} entries fixed`);
}

async function fixPluginManifests() {
	let count = 0;
	for (const e of await readdir(PLUGINS_DIR, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		const manifestPath = join(PLUGINS_DIR, e.name, ".codex-plugin", "plugin.json");
		const file = Bun.file(manifestPath);
		if (!(await file.exists())) continue;
		const data = JSON.parse(await file.text());
		if (data.name !== e.name) {
			data.name = e.name;
			await Bun.write(manifestPath, JSON.stringify(data, null, 2));
			console.log(`  ${e.name}/plugin.json → name="${e.name}"`);
			count++;
		}
	}
	console.log(`[OK] ${count} plugin manifests aligned`);
}

async function fixAgentModels() {
	let count = 0;
	async function walk(dir: string) {
		for (const e of await readdir(dir, { withFileTypes: true })) {
			const p = join(dir, e.name);
			if (e.isDirectory()) {
				if (e.name === "_legacy_py" || e.name === "node_modules") continue;
				await walk(p);
			} else if (e.isFile() && p.endsWith(".toml") && p.includes("/agents/")) {
				let txt = await Bun.file(p).text();
				const before = txt;
				txt = txt.replace(/(model\s*=\s*")gpt-5\.3-codex-mini(")/g, "$1gpt-5.4-mini$2");
				txt = txt.replace(/(model\s*=\s*")gpt-5\.3-codex(")/g, "$1gpt-5.4$2");
				if (txt !== before) {
					await Bun.write(p, txt);
					count++;
				}
			}
		}
	}
	await walk(PLUGINS_DIR);
	console.log(`[OK] ${count} agent TOML files: model names fixed`);
}

async function main() {
	await fixMarketplace();
	await fixPluginManifests();
	await fixAgentModels();
	console.log("Done.");
}

if (import.meta.main) await main();
