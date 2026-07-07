/**
 * merge-agents-md.ts — merge the codex-rules corpus into ~/.codex/AGENTS.md.
 *
 * Codex loads ~/.codex/AGENTS.md NATIVELY and SILENTLY at session start
 * (codex-rs/core/src/agents_md.rs) — no TUI card, unlike hook
 * `hookSpecificOutput.additionalContext`, which Codex always prints and the
 * owner rejected. So the codex-rules corpus (plugins/codex-rules/rules/*.md,
 * ~9.4 KiB) is merged into AGENTS.md at install time instead of injected by
 * hook every session. Idempotent: re-running replaces only the fenced
 * section, byte-identical when inputs are unchanged; content outside the
 * fence (any user edits to AGENTS.md) is preserved untouched.
 *
 * Also raises config.toml's `project_doc_max_bytes` (native default 32 KiB,
 * silent cumulative truncation past it) so the merged file — existing
 * AGENTS.md plus the rules corpus — is never silently cut off as either
 * grows.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { hasKey, setRootKey } from "./toml-helpers";

const START = "<!-- fusengine:codex-rules:start -->";
const END = "<!-- fusengine:codex-rules:end -->";
const MAX_BYTES_KEY = "project_doc_max_bytes";
const MAX_BYTES_VALUE = "65536";

/** Concatenate plugins/codex-rules/rules/*.md, sorted — same order as inject-rules.native.ts. */
export function readRulesCorpus(rulesDir: string): string {
	if (!existsSync(rulesDir)) return "";
	const files = readdirSync(rulesDir).filter((f) => f.endsWith(".md")).sort();
	return files.map((f) => readFileSync(join(rulesDir, f), "utf-8").trimEnd()).join("\n\n");
}

/** Replace the fenced rules section in an AGENTS.md body, or append it if absent. */
export function mergeRulesSection(body: string, rulesCorpus: string): string {
	const section = `${START}\n${rulesCorpus}\n${END}`;
	const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
	if (pattern.test(body)) return body.replace(pattern, section);
	const base = body.trimEnd();
	return base.length > 0 ? `${base}\n\n${section}\n` : `${section}\n`;
}

/** Ensure config.toml declares project_doc_max_bytes; no-op if already present (never lowers a user value). */
export function ensureProjectDocMaxBytes(configSrc: string): string {
	if (hasKey(configSrc, MAX_BYTES_KEY)) return configSrc;
	return setRootKey(configSrc, MAX_BYTES_KEY, MAX_BYTES_VALUE, false);
}

/**
 * Merge plugins/codex-rules/rules/*.md into `${codexHome}/AGENTS.md` and bump
 * `${codexHome}/config.toml`'s doc size cap. No-op if the rules dir is missing
 * (e.g. a stripped install) so this stays a clean pass-through on any harness.
 */
export async function mergeAgentsMd(projectRoot: string, codexHome: string): Promise<void> {
	const rulesDir = join(projectRoot, "plugins", "codex-rules", "rules");
	const rulesCorpus = readRulesCorpus(rulesDir);
	if (!rulesCorpus) return;

	const agentsMdPath = join(codexHome, "AGENTS.md");
	const existingAgentsMd = existsSync(agentsMdPath) ? readFileSync(agentsMdPath, "utf-8") : "";
	await Bun.write(agentsMdPath, mergeRulesSection(existingAgentsMd, rulesCorpus));

	const configTomlPath = join(codexHome, "config.toml");
	const existingConfig = existsSync(configTomlPath) ? readFileSync(configTomlPath, "utf-8") : "";
	const nextConfig = ensureProjectDocMaxBytes(existingConfig);
	if (nextConfig !== existingConfig) await Bun.write(configTomlPath, nextConfig);
}
