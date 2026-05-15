#!/usr/bin/env bun
/**
 * fix-remaining-claude.ts — Targeted cleanup of remaining "claude" references
 * in active plugin files (excluding _legacy_py/, node_modules/, ClaudeBot in
 * robots.txt which is a legitimate web crawler identifier).
 */
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..", "plugins");
const SKIP_DIRS = new Set(["_legacy_py", "node_modules", ".git"]);
const SKIP_FILES = new Set([
	"migration-report.json",
	"py-to-bun-report.json",
	"scrub-report.json",
	"robots-saas.txt",
]);

type Replacer = string | ((m: string) => string);
const RULES: { pattern: RegExp; replacement: Replacer }[] = [
	{ pattern: /\bCLAUDE_CODE_MCP_SERVER_NAME\b/g, replacement: "CODEX_MCP_SERVER_NAME" },
	{ pattern: /\bCLAUDE_CODE_MCP_SERVER_URL\b/g, replacement: "CODEX_MCP_SERVER_URL" },
	{ pattern: /\bCLAUDE_SESSION_ID\b/g, replacement: "CODEX_THREAD_ID" },
	{ pattern: /\bCLAUDE_ENV_FILE\b/g, replacement: "CODEX_ENV_FILE" },
	{ pattern: /\bCLAUDE_[A-Z_]+\b/g, replacement: (m: string) => m.replace(/^CLAUDE_/, "CODEX_") },
	{ pattern: /claude_desktop_config\.json/g, replacement: "~/.codex/config.toml" },
	{ pattern: /\bCLAUDE\.md\b/g, replacement: "AGENTS.md" },
	{ pattern: /\bclaude_/g, replacement: "codex_" },
	{ pattern: /\bClaude_/g, replacement: "Codex_" },
	{ pattern: /(?<!Bot)\bClaude\b(?!Bot)/g, replacement: "Codex" },
	{ pattern: /\bclaude\b/g, replacement: "codex" },
];

async function walk(dir: string, out: string[] = []): Promise<string[]> {
	for (const e of await readdir(dir, { withFileTypes: true })) {
		if (e.isDirectory()) {
			if (SKIP_DIRS.has(e.name)) continue;
			await walk(join(dir, e.name), out);
		} else if (e.isFile() && !SKIP_FILES.has(e.name)) {
			out.push(join(dir, e.name));
		}
	}
	return out;
}

function apply(src: string): { content: string; count: number } {
	let count = 0;
	let out = src;
	for (const { pattern, replacement } of RULES) {
		out = out.replace(pattern, (m: string) => {
			count++;
			return typeof replacement === "function" ? replacement(m) : replacement;
		});
	}
	return { content: out, count };
}

async function main() {
	const files = await walk(ROOT);
	const touched: { path: string; replacements: number }[] = [];
	for (const f of files) {
		try {
			const before = await Bun.file(f).text();
			const { content, count } = apply(before);
			if (count > 0) {
				await Bun.write(f, content);
				touched.push({ path: relative(ROOT, f), replacements: count });
			}
		} catch {
			// binary or unreadable, skip
		}
	}
	console.log(`Fixed ${touched.length} files (${touched.reduce((s, t) => s + t.replacements, 0)} replacements).`);
}

if (import.meta.main) await main();
