import { parseFrontmatter } from "./yaml.ts";
import { adaptAgentDescription, adaptAgentInstructions } from "./agent-adapter.ts";
import { identityNicknames, normalizeSkillNames } from "./agent-names.ts";
import { skillConfigLines, tomlArray, tomlMultiline, tomlString } from "./agent-toml-format.ts";
import type { AgentTomlOptions } from "./agent.types.ts";

/** A supported Codex model and reasoning-effort pair. */
type ModelProfile = {
	model: "gpt-5.6-sol" | "gpt-5.6-terra" | "gpt-5.6-luna";
	effort: "medium" | "high" | "xhigh" | "max";
};

const SOL_MEDIUM: ModelProfile = { model: "gpt-5.6-sol", effort: "medium" };
const SOL_HIGH: ModelProfile = { model: "gpt-5.6-sol", effort: "high" };
const SOL_XHIGH: ModelProfile = { model: "gpt-5.6-sol", effort: "xhigh" };
const LUNA_MAX: ModelProfile = { model: "gpt-5.6-luna", effort: "max" };
const TERRA_HIGH: ModelProfile = { model: "gpt-5.6-terra", effort: "high" };

/**
 * Canonical shipped-agent policy. Source Claude tiers are not sufficiently
 * expressive for the intentional per-role Codex model and effort choices.
 */
const AGENT_MODEL_PROFILES: Record<string, ModelProfile> = {
	"astro-expert": SOL_MEDIUM,
	"changelog-watcher": SOL_MEDIUM,
	"explore-codebase": SOL_MEDIUM,
	"go-expert": SOL_MEDIUM,
	"laravel-expert": SOL_MEDIUM,
	"nextjs-expert": SOL_MEDIUM,
	"php-expert": SOL_MEDIUM,
	"react-expert": SOL_MEDIUM,
	"rust-expert": SOL_MEDIUM,
	"seo-cluster": SOL_MEDIUM,
	"seo-content": SOL_MEDIUM,
	"seo-expert": SOL_MEDIUM,
	"seo-geo": SOL_MEDIUM,
	"seo-local": SOL_MEDIUM,
	"seo-schema": SOL_MEDIUM,
	"seo-technical": SOL_MEDIUM,
	"shadcn-ui-expert": SOL_MEDIUM,
	"swift-expert": SOL_MEDIUM,
	"tailwindcss-expert": SOL_MEDIUM,
	"tanstack-start-expert": SOL_MEDIUM,
	"typescript-expert": SOL_MEDIUM,
	websearch: SOL_MEDIUM,
	brainstorming: SOL_HIGH,
	challenger: SOL_HIGH,
	"prompt-engineer": SOL_HIGH,
	"research-expert": SOL_HIGH,
	"security-expert": SOL_HIGH,
	sniper: SOL_HIGH,
	"solid-orchestrator": SOL_HIGH,
	"design-expert": SOL_XHIGH,
	cartographer: LUNA_MAX,
	"commit-detector": LUNA_MAX,
	"lessons-compactor": LUNA_MAX,
	"seo-images": LUNA_MAX,
	"seo-sitemap": LUNA_MAX,
	"sniper-faster": LUNA_MAX,
	commit: TERRA_HIGH,
};

/** New agents default to the standard execution profile until explicitly classified. */
const FALLBACK_PROFILE = SOL_MEDIUM;

const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

/** Resolve the configured Codex profile for a named source agent. */
function resolveModelProfile(name: string): ModelProfile {
	return AGENT_MODEL_PROFILES[name] ?? FALLBACK_PROFILE;
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
	const profile = resolveModelProfile(name);
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
		`model = ${tomlString(profile.model)}`,
		`model_reasoning_effort = ${tomlString(profile.effort)}`,
		`nickname_candidates = ${tomlArray(nicknames)}`,
		`sandbox_mode = ${tomlString(sandbox)}`,
		...tomlMultiline("developer_instructions", instructions),
		...skillConfigLines(skillPaths),
		"",
	];
	return lines.join("\n");
}
