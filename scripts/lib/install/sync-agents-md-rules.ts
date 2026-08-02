/**
 * sync-agents-md-rules.ts — decide what the installer does with the
 * `fusengine:codex-rules` fences in `${codexHome}/AGENTS.md`.
 *
 * DEFAULT: prune. The corpus is delivered by the `codex-rules` hook alone
 * (SessionStart / SubagentStart / UserPromptSubmit); merging it into AGENTS.md
 * as well made every agent load it twice, since Codex reads AGENTS.md natively
 * and each sub-agent re-reads it from disk.
 *
 * OPT-IN: `FUSE_RULES_MERGE_AGENTS_MD=1` restores the legacy install-time
 * merge — the escape hatch if hook trust ever fails and the native silent
 * baseline is needed again. See merge-agents-md.ts for the merge itself.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mergeAgentsMd, stripRulesSection } from "./merge-agents-md";

/** Env flag that re-enables the legacy install-time merge. */
export const MERGE_FLAG = "FUSE_RULES_MERGE_AGENTS_MD";

/**
 * Strip a previously merged rules fence from `${codexHome}/AGENTS.md`.
 *
 * @param codexHome - Absolute path to CODEX_HOME.
 * @returns `true` when a fence was found and removed, `false` otherwise.
 */
export async function pruneAgentsMdRules(codexHome: string): Promise<boolean> {
	const agentsMdPath = join(codexHome, "AGENTS.md");
	if (!existsSync(agentsMdPath)) return false;
	const body = readFileSync(agentsMdPath, "utf-8");
	const next = stripRulesSection(body);
	if (next === body) return false;
	await Bun.write(agentsMdPath, next);
	return true;
}

/**
 * Install-time entry point: prune the rules fence, or merge it when
 * `FUSE_RULES_MERGE_AGENTS_MD=1` is set.
 *
 * @param projectRoot - Absolute path to the codex-plugins checkout.
 * @param codexHome - Absolute path to CODEX_HOME.
 * @returns The action taken, for the installer to report.
 */
export async function syncAgentsMdRules(projectRoot: string, codexHome: string): Promise<"merged" | "pruned" | "noop"> {
	if (process.env[MERGE_FLAG] === "1") {
		await mergeAgentsMd(projectRoot, codexHome);
		return "merged";
	}
	return (await pruneAgentsMdRules(codexHome)) ? "pruned" : "noop";
}
