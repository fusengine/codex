/**
 * cleanup-deprecated-flags.ts - Remove deprecated Codex feature flag names
 * from user runtime files that can be loaded or surfaced by Codex App.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import * as p from "@clack/prompts";

const TEXT_FILE_RE = /\.(toml|json|jsonl|md|txt)$/;
const SKIP_DIRS = new Set([
	"sessions",
	"memories",
	"logs",
	"node_modules",
]);

function migrateDeprecatedFlags(content: string): string {
	return content
		.replaceAll("[features].codex_hooks", "[features].hooks")
		.replaceAll("codex_hooks", "hooks");
}

function shouldVisit(path: string): boolean {
	return !SKIP_DIRS.has(basename(path));
}

function collectFiles(root: string, out: string[]): void {
	if (!existsSync(root)) return;
	const stat = statSync(root);
	if (stat.isFile()) {
		if (TEXT_FILE_RE.test(root)) out.push(root);
		return;
	}
	if (!stat.isDirectory() || !shouldVisit(root)) return;
	for (const entry of readdirSync(root)) {
		collectFiles(join(root, entry), out);
	}
}

function rewriteFile(path: string): boolean {
	const before = readFileSync(path, "utf8");
	const after = migrateDeprecatedFlags(before);
	if (after === before) return false;
	writeFileSync(path, after);
	return true;
}

export function cleanupDeprecatedCodexFlags(codexHome: string): number {
	const targets: string[] = [];
	collectFiles(codexHome, targets);

	let changed = 0;
	for (const file of [...new Set(targets)]) {
		try {
			if (rewriteFile(file)) changed++;
		} catch (error) {
			p.log.warn(`deprecated flag cleanup skipped ${file}: ${(error as Error).message}`);
		}
	}
	if (changed > 0) p.log.success(`deprecated codex_hooks flags cleaned in ${changed} file(s)`);
	return changed;
}
