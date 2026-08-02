import { parseFrontmatter } from "./yaml.ts";
import { adaptAgentDescription, adaptAgentInstructions } from "./agent-adapter.ts";
import { identityNicknames, normalizeSkillNames } from "./agent-names.ts";
import { skillConfigLines, tomlArray, tomlMultiline, tomlString } from "./agent-toml-format.ts";
import type { AgentTomlOptions } from "./agent.types.ts";

/**
 * Strict 3-tier model/effort matrix. Each Claude source model maps to a
 * single tier, and a tier's model and reasoning effort are always derived
 * together so no caller can produce a model/effort pair outside the matrix.
 *
 * Tiers: `sol` (judgment/refutation/security, high effort), `terra` (domain
 * experts/explorers, medium effort), `luna` (mechanical agents, max effort —
 * intentional: cheapest model paired with the highest effort setting).
 */
const TIERS = {
	sol: { model: "gpt-5.6-sol", effort: "high" },
	terra: { model: "gpt-5.6-terra", effort: "medium" },
	luna: { model: "gpt-5.6-luna", effort: "max" },
} as const;

type Tier = keyof typeof TIERS;

const CLAUDE_MODEL_TIER: Record<string, Tier> = {
	opus: "sol",
	sonnet: "terra",
	haiku: "luna",
};
const LEGACY_CODEX_MODEL_RE = new RegExp(String.raw`^gpt-5\.(?:3|4|5)(?:-|$)`);
const FALLBACK_TIER: Tier = "terra";

const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

/** Resolve the {model, effort} pair for a Claude source `model` frontmatter value. */
function resolveTier(claudeModel: string | undefined): typeof TIERS[Tier] {
	if (!claudeModel || LEGACY_CODEX_MODEL_RE.test(claudeModel)) return TIERS[FALLBACK_TIER];
	const tier = CLAUDE_MODEL_TIER[claudeModel];
	return tier ? TIERS[tier] : TIERS[FALLBACK_TIER];
}

function sandboxFor(tools: string[] | undefined): string {
	if (!tools || tools.length === 0) return "read-only";
	return tools.some((tool) => WRITE_TOOLS.has(tool)) ? "workspace-write" : "read-only";
}

/** Convert one YAML-frontmatter agent source into Codex custom agent TOML. */
export function buildAgentToml(raw: string, options?: AgentTomlOptions): string {
	const { data, body } = parseFrontmatter(raw);
	const name = String(data.name ?? "unnamed");
	const description = adaptAgentDescription(String(data.description ?? ""));
	const tier = resolveTier(String(data.model ?? ""));
	const nicknames = identityNicknames(name, data.nickname_candidates);
	const declaredSkills = normalizeSkillNames(data.skills);
	const skillNames = declaredSkills.length > 0 ? declaredSkills : options?.fallbackSkillNames ?? [];
	const skillPaths = options?.resolveSkillPaths(skillNames) ?? [];
	const tools = Array.isArray(data.tools) ? data.tools : data.tools ? [String(data.tools)] : [];
	const sandbox = sandboxFor(tools);
	const instructions = adaptAgentInstructions(body.trim());

	const lines = [
		`name = ${tomlString(name)}`,
		`description = ${tomlString(description)}`,
		`model = ${tomlString(tier.model)}`,
		`model_reasoning_effort = ${tomlString(tier.effort)}`,
		`nickname_candidates = ${tomlArray(nicknames)}`,
		`sandbox_mode = ${tomlString(sandbox)}`,
		...tomlMultiline("developer_instructions", instructions),
		...skillConfigLines(skillPaths),
		"",
	];
	return lines.join("\n");
}
