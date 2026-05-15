#!/usr/bin/env bun
/**
 * fix-real-issues.ts — Fixes from deep doc audit:
 *   1. plugin.json `interface`: replace invented {cli, ide} with doc fields
 *   2. hooks.json SessionStart `matcher`: replace invented values with ""
 *   3. hooks.json `matcher` on UserPromptSubmit/Stop: remove (doc says ignored)
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "plugins");

const INTERFACE_MAP: Record<string, { displayName: string; shortDescription: string; developerName: string }> = {
	"ai-pilot": { displayName: "AI Pilot", shortDescription: "Expert agents: sniper, research-expert, explore-codebase, websearch", developerName: "Fusengine" },
	"astro-expert": { displayName: "Astro Expert", shortDescription: "Astro 6 framework specialist with Islands Architecture", developerName: "Fusengine" },
	"cartographer": { displayName: "Cartographer", shortDescription: "Codebase mapping and ecosystem navigation", developerName: "Fusengine" },
	"changelog-watcher": { displayName: "Changelog Watcher", shortDescription: "Monitor Codex CLI updates and breaking changes", developerName: "Fusengine" },
	"codex-rules": { displayName: "Codex Rules", shortDescription: "Global APEX/SOLID/DRY rules and project detection", developerName: "Fusengine" },
	"commit-pro": { displayName: "Commit Pro", shortDescription: "Smart conventional commits with security validation", developerName: "Fusengine" },
	"core-guards": { displayName: "Core Guards", shortDescription: "Security and SOLID enforcement hooks + statusline", developerName: "Fusengine" },
	"design-expert": { displayName: "Design Expert", shortDescription: "UI designer with 7-phase pipeline and OKLCH tokens", developerName: "Fusengine" },
	"laravel-expert": { displayName: "Laravel Expert", shortDescription: "Laravel 12 backend specialist", developerName: "Fusengine" },
	"memory-neural": { displayName: "Memory Neural", shortDescription: "Persistent file-based memory system", developerName: "Fusengine" },
	"nextjs-expert": { displayName: "Next.js Expert", shortDescription: "Next.js 16 with App Router, RSC, Server Actions", developerName: "Fusengine" },
	"prompt-engineer": { displayName: "Prompt Engineer", shortDescription: "Expert AI prompt creation and optimization", developerName: "Fusengine" },
	"react-expert": { displayName: "React Expert", shortDescription: "React 19 with TanStack Router, Zustand, Testing Library", developerName: "Fusengine" },
	"security-expert": { displayName: "Security Expert", shortDescription: "OWASP Top 10 + CVE research + dependency audit", developerName: "Fusengine" },
	"seo": { displayName: "SEO Expert", shortDescription: "SEO/SEA/GEO 2026 organic + paid + AI search", developerName: "Fusengine" },
	"shadcn-expert": { displayName: "shadcn/ui Expert", shortDescription: "shadcn/ui with Radix + Base UI primitives", developerName: "Fusengine" },
	"solid": { displayName: "SOLID Orchestrator", shortDescription: "SOLID principles across multi-language projects", developerName: "Fusengine" },
	"swift-apple-expert": { displayName: "Swift Apple Expert", shortDescription: "Swift 6.2 + SwiftUI for all Apple platforms", developerName: "Fusengine" },
	"tailwindcss": { displayName: "Tailwind CSS Expert", shortDescription: "Tailwind v4.1 with OKLCH, container queries", developerName: "Fusengine" },
};

async function fixManifests(): Promise<number> {
	let count = 0;
	for (const e of await readdir(ROOT, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		const path = join(ROOT, e.name, ".codex-plugin", "plugin.json");
		const file = Bun.file(path);
		if (!(await file.exists())) continue;
		const data = JSON.parse(await file.text());
		const meta = INTERFACE_MAP[e.name];
		if (!meta) continue;
		data.interface = { ...meta };
		await Bun.write(path, JSON.stringify(data, null, 2));
		count++;
	}
	console.log(`[OK] ${count} plugin.json interface blocks fixed`);
	return count;
}

const VALID_SESSION_MATCHERS = new Set(["", "startup", "resume", "clear", "startup|resume", "startup|resume|clear"]);

async function fixHooks(): Promise<number> {
	let count = 0;
	for (const e of await readdir(ROOT, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		const hooks = join(ROOT, e.name, "hooks", "hooks.json");
		const file = Bun.file(hooks);
		if (!(await file.exists())) continue;
		const data = JSON.parse(await file.text());
		let changed = false;
		for (const event of Object.keys(data.hooks ?? {})) {
			for (const matcher of data.hooks[event]) {
				if (event === "UserPromptSubmit" || event === "Stop") {
					if (matcher.matcher !== undefined) {
						delete matcher.matcher;
						changed = true;
					}
				} else if (event === "SessionStart") {
					if (matcher.matcher && !VALID_SESSION_MATCHERS.has(matcher.matcher)) {
						matcher.matcher = "";
						changed = true;
					}
				}
			}
		}
		if (changed) {
			await Bun.write(hooks, JSON.stringify(data, null, 2));
			count++;
		}
	}
	console.log(`[OK] ${count} hooks.json matcher issues fixed`);
	return count;
}

async function main() {
	await fixManifests();
	await fixHooks();
	console.log("Done.");
}

if (import.meta.main) await main();
