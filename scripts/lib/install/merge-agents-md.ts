/**
 * merge-agents-md.ts — AGENTS.md rules-fence lifecycle (prune by default).
 *
 * The codex-rules corpus (plugins/codex-rules/rules/*.md, ~18 KiB) reaches
 * agents through ONE mechanism: the `codex-rules` hook, which injects it via
 * `hookSpecificOutput.additionalContext` on SessionStart / SubagentStart /
 * UserPromptSubmit (kill switch: FUSE_RULES_INJECT=0).
 *
 * It used to ALSO be merged into `${codexHome}/AGENTS.md` between the
 * `fusengine:codex-rules` fences at install time. Codex loads that file
 * natively at session start AND every sub-agent re-reads it from disk, so
 * every agent paid the corpus TWICE (measured: 245 of 391 AGENTS.md lines
 * duplicating the 18 078 bytes the hook already returns). Owner decision:
 * inject, do not merge — the merge is off.
 *
 * `syncAgentsMdRules` is therefore a CLEANUP step by default: it strips any
 * fenced section a previous install left behind. `FUSE_RULES_MERGE_AGENTS_MD=1`
 * restores the legacy merge (escape hatch if hook trust ever fails and the
 * native silent baseline is needed again).
 *
 * The merge path also raises config.toml's `project_doc_max_bytes` (native
 * default 32 KiB, silent cumulative truncation past it). The prune path never
 * touches config.toml — it must not lower a value already set.
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

/**
 * Remove the fenced rules section from an AGENTS.md body, collapsing the blank
 * lines it leaves behind. Content outside the fence is preserved verbatim;
 * returns the body unchanged when no fence is present.
 */
export function stripRulesSection(body: string): string {
	const pattern = new RegExp(`\\n*${START}[\\s\\S]*?${END}\\n*`);
	if (!pattern.test(body)) return body;
	const next = body.replace(pattern, "\n");
	return next.trim().length === 0 ? "" : next.replace(/^\n+/, "");
}

/** Ensure config.toml declares project_doc_max_bytes; no-op if already present (never lowers a user value). */
export function ensureProjectDocMaxBytes(configSrc: string): string {
	if (hasKey(configSrc, MAX_BYTES_KEY)) return configSrc;
	return setRootKey(configSrc, MAX_BYTES_KEY, MAX_BYTES_VALUE, false);
}

/**
 * LEGACY, opt-in only (`FUSE_RULES_MERGE_AGENTS_MD=1`). Merge
 * plugins/codex-rules/rules/*.md into `${codexHome}/AGENTS.md` and bump
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
