#!/usr/bin/env bun
/**
 * final-conformance.ts — final fixes for full Codex doc conformance.
 *   1. Strip non-conformant SKILL.md frontmatter fields
 *   2. Restore migration scripts source paths
 */
import { join } from "node:path";
import { cleanSkills } from "./lib/final/skills";
import { restoreMigrationScripts } from "./lib/final/restore";

const ROOT = join(import.meta.dir, "..");

async function main() {
	await cleanSkills(join(ROOT, "plugins"));
	await restoreMigrationScripts(ROOT);
	console.log("Done.");
}

if (import.meta.main) await main();
