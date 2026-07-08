import { parseFrontmatter } from "./yaml.ts";
import { adaptAgentDescription, adaptAgentInstructions } from "./agent-adapter.ts";
import { identityNicknames, normalizeSkillNames } from "./agent-names.ts";
import { skillConfigLines, tomlArray, tomlMultiline, tomlString } from "./agent-toml-format.ts";
import type { AgentTomlOptions } from "./agent.types.ts";

const MODEL_MAP: Record<string, string> = {
	opus: "gpt-5.5",
	sonnet: "gpt-5.5",
	haiku: "gpt-5.5",
};
const LEGACY_CODEX_MODEL_RE = new RegExp(String.raw`^gpt-5\.(?:3|4)(?:-|$)`);

const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const EFFORT_MAP: Record<string, string> = {
	minimal: "high",
	low: "high",
	medium: "high",
	high: "high",
	xhigh: "xhigh",
};
const FAST_AGENT_RE =
	/brainstorming|cartographer|changelog-watcher|commit-detector|sniper-faster|websearch|seo-(cluster|content|geo|images|local|schema|sitemap)\b/;

function mapModel(claudeModel: string | undefined): string {
	if (!claudeModel) return "gpt-5.5";
	if (LEGACY_CODEX_MODEL_RE.test(claudeModel)) return "gpt-5.5";
	return MODEL_MAP[claudeModel] ?? claudeModel;
}

function sandboxFor(tools: string[] | undefined): string {
	if (!tools || tools.length === 0) return "read-only";
	return tools.some((tool) => WRITE_TOOLS.has(tool)) ? "workspace-write" : "read-only";
}

function reasoningEffortFor(name: string): string {
	return FAST_AGENT_RE.test(name) ? "high" : "xhigh";
}

function mapReasoningEffort(value: string | undefined, name: string): string {
	if (!value) return reasoningEffortFor(name);
	return EFFORT_MAP[value] ?? reasoningEffortFor(name);
}

/** Convert one YAML-frontmatter agent source into Codex custom agent TOML. */
export function buildAgentToml(raw: string, options?: AgentTomlOptions): string {
	const { data, body } = parseFrontmatter(raw);
	const name = String(data.name ?? "unnamed");
	const description = adaptAgentDescription(String(data.description ?? ""));
	const model = mapModel(String(data.model ?? ""));
	const effort = mapReasoningEffort(String(data.model_reasoning_effort ?? data.effort ?? ""), name);
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
		`model = ${tomlString(model)}`,
		`model_reasoning_effort = ${tomlString(effort)}`,
		`nickname_candidates = ${tomlArray(nicknames)}`,
		`sandbox_mode = ${tomlString(sandbox)}`,
		...tomlMultiline("developer_instructions", instructions),
		...skillConfigLines(skillPaths),
		"",
	];
	return lines.join("\n");
}
