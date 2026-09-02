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
const TERRA_MEDIUM: ModelProfile = { model: "gpt-5.6-terra", effort: "medium" };

/**
 * Canonical shipped-agent policy (37 agents, revised 2026-09-01, corrected
 * same day after re-checking the Artificial Analysis figures our own first
 * pass cited against the source page). Source Claude tiers are not
 * sufficiently expressive for the intentional per-role Codex model and
 * effort choices.
 *
 * Verified facts backing this matrix:
 * - Codex 0.152.0 model catalog: Sol is the "Latest frontier agentic coding
 *   model", Terra the "Balanced agentic coding model for everyday work", Luna
 *   the "Fast and affordable agentic coding model". Luna has no `ultra`
 *   effort; `ultra` itself means "Maximum reasoning with automatic task
 *   delegation" and is never appropriate for a sub-agent.
 * - Artificial Analysis Intelligence Index (artificialanalysis.ai/models/
 *   gpt-5-6-luna and the Sol launch article, July 2026): Sol low 51, Sol
 *   medium 56, Sol high 57, Sol xhigh 59, Luna max 52. Sol max is not
 *   used by any shipped agent and is not asserted here (published figures
 *   diverge between AA pages). Sol medium<->high (56->57, -1/+1) is the
 *   only gap within the
 *   owner's 1-point non-regression threshold: the three gates (challenger,
 *   sniper, security-expert) stayed on `high` in that revision;
 *   `prompt-engineer` was already `high`. Superseded on 2026-09-02 for
 *   `sniper` only — see the judgment-roles sentence below.
 * - `design-expert` stays on Sol `xhigh` (59): moving it to `high` (57) is a
 *   2-point drop, over threshold, so it is NOT reclassified despite being a
 *   one-shot-correctness gate like the other three.
 * - `seo-technical`, `seo-schema`, and `websearch` stay on Sol `medium`
 *   (56): moving them to Luna `max` (52) is a 4-point drop, over threshold.
 *   Being a bounded, deterministic, strict-contract task is necessary but
 *   not sufficient for a Sol -> Luna move; the measured regression vetoes it
 *   here, so they are NOT reclassified.
 * - A 2026-09-02 15-run `codex exec` 0.152.1 benchmark (3 bounded coding
 *   tasks — a bug fix with 7 hidden tests, a spec-driven feature with 25
 *   hidden tests, and a 3-file CLI change with 8 hidden tests — each run
 *   across 5 configs) passed every hidden test on every config. Wall time
 *   totals: Terra medium 210s, Terra high 225s, Sol medium 353s, Sol high
 *   370s, Luna max 427s. Estimated 3-task cost: Terra medium $0.31 vs Sol
 *   medium $0.64 (published pricing per 1M tokens: Sol $4 in / $0.40 cached
 *   / $20 out, Terra $2 / $0.20 / $12, Luna $0.20 / $0.02 / $1.20). Terra
 *   medium — Terra's default effort — is therefore the executor tier for
 *   the 12 framework experts, which run bounded, briefed lots on disjoint
 *   file lots. Sol stays on judgment roles (challenger, security-expert,
 *   prompt-engineer at high; design-expert at xhigh; sniper at medium —
 *   owner decision 2026-09-02: sniper validates code with tooling and
 *   tests, where the benchmark showed medium equal to high, while the
 *   challenger keeps high for adversarial review), on the
 *   analysis/research/coordination agents at medium — including
 *   `commit`, whose irreversible git flow (write, tags, merges) keeps it on
 *   a coordination-tier model rather than an executor one — and the
 *   coordinator session itself stays Sol high. Luna max stays on the 5
 *   mechanical agents. The risk is not closed: openai/codex#32389 is still
 *   open in 0.152 — Terra intermittently returns an empty final response
 *   after tool use, ending the loop early, reported at medium effort. The
 *   mitigation is the doctrine itself: the coordinator verifies every
 *   deliverable on disk against the PRD and gates acceptance on challenger
 *   + sniper, so the failure mode is a retry, not a silent bad merge. The
 *   earlier field report of Terra burning Codex usage quota faster than Sol
 *   without a matching quality gain is kept as context but was not
 *   reproduced by this benchmark.
 * - `research-expert`, `brainstorming`, and `solid-orchestrator` moved from
 *   Sol high to Sol medium (57->56, -1): within threshold.
 * - `lessons-compactor` moved from Luna max to Sol medium (52->56, +4): a
 *   strict quality increase, not a regression risk, for a role needing
 *   long-horizon dedup/merge judgment rather than a bounded mechanical task.
 */
const AGENT_MODEL_PROFILES: Record<string, ModelProfile> = {
	"astro-expert": TERRA_MEDIUM,
	"go-expert": TERRA_MEDIUM,
	"laravel-expert": TERRA_MEDIUM,
	"nextjs-expert": TERRA_MEDIUM,
	"php-expert": TERRA_MEDIUM,
	"react-expert": TERRA_MEDIUM,
	"rust-expert": TERRA_MEDIUM,
	"shadcn-ui-expert": TERRA_MEDIUM,
	"swift-expert": TERRA_MEDIUM,
	"tailwindcss-expert": TERRA_MEDIUM,
	"tanstack-start-expert": TERRA_MEDIUM,
	"typescript-expert": TERRA_MEDIUM,
	"explore-codebase": SOL_MEDIUM,
	"research-expert": SOL_MEDIUM,
	brainstorming: SOL_MEDIUM,
	"solid-orchestrator": SOL_MEDIUM,
	commit: SOL_MEDIUM,
	"changelog-watcher": SOL_MEDIUM,
	"lessons-compactor": SOL_MEDIUM,
	"seo-expert": SOL_MEDIUM,
	"seo-content": SOL_MEDIUM,
	"seo-geo": SOL_MEDIUM,
	"seo-local": SOL_MEDIUM,
	"seo-cluster": SOL_MEDIUM,
	"seo-technical": SOL_MEDIUM,
	"seo-schema": SOL_MEDIUM,
	websearch: SOL_MEDIUM,
	sniper: SOL_MEDIUM,
	challenger: SOL_HIGH,
	"security-expert": SOL_HIGH,
	"prompt-engineer": SOL_HIGH,
	"design-expert": SOL_XHIGH,
	"sniper-faster": LUNA_MAX,
	"commit-detector": LUNA_MAX,
	cartographer: LUNA_MAX,
	"seo-images": LUNA_MAX,
	"seo-sitemap": LUNA_MAX,
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
