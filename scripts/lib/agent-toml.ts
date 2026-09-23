import { parseFrontmatter } from "./yaml.ts";
import { adaptAgentDescription, adaptAgentInstructions } from "./agent-adapter.ts";
import { identityNicknames, normalizeSkillNames } from "./agent-names.ts";
import { skillConfigLines, tomlArray, tomlMultiline, tomlString } from "./agent-toml-format.ts";
import type { AgentTomlOptions } from "./agent.types.ts";

/** A supported Codex model and reasoning-effort pair. */
type ModelProfile = {
	model: "gpt-6-sol" | "gpt-6-luna";
	effort: "medium" | "high";
};

const SOL_MEDIUM: ModelProfile = { model: "gpt-6-sol", effort: "medium" };
const SOL_HIGH: ModelProfile = { model: "gpt-6-sol", effort: "high" };
const LUNA_MEDIUM: ModelProfile = { model: "gpt-6-luna", effort: "medium" };

/**
 * Canonical shipped-agent policy (37 agents, GPT-6 fleet, applied
 * 2026-09-23). Prior gpt-5.6 sol/terra/luna tiers (2026-09-01, -02, -07:
 * Terra medium for the 12 framework experts + explore-codebase/research-expert/
 * websearch; Sol high only for design-expert; security-expert moved to Sol
 * medium 2026-09-07 for a local-only ethical-hacker posture, per
 * `.codex/apex/task.json` task `security-local-medium`) are superseded
 * wholesale by this matrix — condensed here as history, not reproduced.
 *
 * Owner decision (verbatim, 2026-09-23, in order): "supprime astra il
 * coute chere" · "j'ai trouvé luna medium plus performant" · "donc on
 * répartie comment les model et raisonnement sur luna le high on oublie je
 * pense non?" · "appliquer". Astra (GPT-6's mid-tier, would-be Terra
 * successor) is dropped fleet-wide on cost; Luna `high` is dropped too —
 * every former Terra/medium and Luna/max agent regroups onto Luna
 * `medium`.
 *
 * Benchmark evidence backing the move (24 runs, codex-cli 0.156.1,
 * `--ignore-user-config --ignore-rules`, 3 hidden-test tasks x 2 reps):
 * semver edge cases — Luna6/medium 0.931, Sol6/low 0.938, Luna6/high 0.992,
 * Sol6/medium 1.000; real-repo debugging and strict typed emitter — 100%
 * for all four configs except Sol6/low, whose emitter did not compile
 * under strict tsconfig (0/2). Mean wall time: Luna6/medium 63s, Sol6/medium
 * 160s, Luna6/high 302s (max 1068s). USD/run: Luna6/medium 0.007,
 * Luna6/high 0.021, Sol6/low 0.098, Sol6/medium 0.210. Prices per 1M
 * tokens (developers.openai.com/api/docs/pricing, confirmed 2026-09-23 via
 * fuse-browser + Exa, standard tier short context): gpt-6-sol 2.00 in /
 * 0.20 cached / 10.00 out; gpt-6-luna 0.10 / 0.01 / 0.50; gpt-6-astra
 * excluded on cost.
 *
 * Resulting matrix: Sol `high` is `design-expert` only (1 agent) —
 * one-shot-correctness gate, unchanged. Sol `medium` (18) covers judgment,
 * coordination, and irreversible-action roles: `brainstorming`,
 * `challenger`, `commit`, `explore-codebase`, `research-expert`, `sniper`,
 * `changelog-watcher`, `lessons-compactor`, `prompt-engineer`,
 * `security-expert`, the six deterministic/analysis `seo-*` roles
 * (`seo-cluster`, `seo-content`, `seo-expert`, `seo-geo`, `seo-local`,
 * `seo-schema`, `seo-technical`), and `solid-orchestrator`. Luna `medium`
 * (18) covers the 12 framework experts plus the mechanical/high-volume
 * roles: `sniper-faster`, `websearch`, `cartographer`, `commit-detector`,
 * `seo-images`, `seo-sitemap` — Luna/medium's near-Sol/medium accuracy at
 * ~2.5x lower wall time and ~30x lower cost makes it the default executor
 * tier; Luna/high is not assigned to any shipped agent.
 */
export const AGENT_MODEL_PROFILES: Record<string, ModelProfile> = {
	"astro-expert": LUNA_MEDIUM,
	"go-expert": LUNA_MEDIUM,
	"laravel-expert": LUNA_MEDIUM,
	"nextjs-expert": LUNA_MEDIUM,
	"php-expert": LUNA_MEDIUM,
	"react-expert": LUNA_MEDIUM,
	"rust-expert": LUNA_MEDIUM,
	"shadcn-ui-expert": LUNA_MEDIUM,
	"swift-expert": LUNA_MEDIUM,
	"tailwindcss-expert": LUNA_MEDIUM,
	"tanstack-start-expert": LUNA_MEDIUM,
	"typescript-expert": LUNA_MEDIUM,
	"sniper-faster": LUNA_MEDIUM,
	websearch: LUNA_MEDIUM,
	cartographer: LUNA_MEDIUM,
	"commit-detector": LUNA_MEDIUM,
	"seo-images": LUNA_MEDIUM,
	"seo-sitemap": LUNA_MEDIUM,
	brainstorming: SOL_MEDIUM,
	"solid-orchestrator": SOL_MEDIUM,
	commit: SOL_MEDIUM,
	"explore-codebase": SOL_MEDIUM,
	"research-expert": SOL_MEDIUM,
	"changelog-watcher": SOL_MEDIUM,
	"lessons-compactor": SOL_MEDIUM,
	"seo-expert": SOL_MEDIUM,
	"seo-content": SOL_MEDIUM,
	"seo-geo": SOL_MEDIUM,
	"seo-local": SOL_MEDIUM,
	"seo-cluster": SOL_MEDIUM,
	"seo-technical": SOL_MEDIUM,
	"seo-schema": SOL_MEDIUM,
	sniper: SOL_MEDIUM,
	"prompt-engineer": SOL_MEDIUM,
	challenger: SOL_MEDIUM,
	"security-expert": SOL_MEDIUM,
	"design-expert": SOL_HIGH,
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
