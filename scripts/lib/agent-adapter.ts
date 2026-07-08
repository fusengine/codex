const oldVendor = ["Clau", "de"].join("");
const oldProduct = [oldVendor, " Code"].join("");
const oldDocsHost = ["code", oldVendor.toLowerCase(), "com"].join(".");
const oldSearchTool = ["Web", "Search"].join("");
const oldFetchTool = ["Web", "Fetch"].join("");
const oldParallelTool = ["T", "ask"].join("");
const oldPluginExaPrefix = ["mcp__plugin_fuse-ai-pilot", "_exa__"].join("");

const DESCRIPTION_REPLACEMENTS: Array<[RegExp, string]> = [[textRe(oldProduct), "Codex"]];

const INSTRUCTION_REPLACEMENTS: Array<[RegExp, string]> = [
	[textRe(oldProduct), "Codex"],
	[textRe(`${oldDocsHost}/docs/en/changelog.md`), "developers.openai.com/codex/changelog"],
	[textRe(`${oldDocsHost}/docs/llms.txt`), "developers.openai.com/codex"],
	[textRe(`${oldVendor} web search`), "Codex web search"],
	[textRe(oldPluginExaPrefix), "mcp__exa__"],
	[lineRe(`${oldSearchTool}\\s+# Built-in Codex web search`), "mcp__fuse-browser__browser_serp_batch  # Fallback search"],
	[lineRe(`${oldFetchTool}\\s+# Direct URL fetch`), "mcp__fuse-browser__browser_fetch        # Direct URL fetch"],
	[textRe(`${oldSearchTool}/${oldFetchTool}`), "fuse-browser"],
	[wordRe(oldSearchTool), "mcp__fuse-browser__browser_serp_batch"],
	[wordRe(oldFetchTool), "mcp__fuse-browser__browser_fetch"],
	[textRe(`use the \`${oldParallelTool}\` tool to launch in parallel`), "use available Codex subagents to launch parallel checks"],
	[textRe(`use \`${oldParallelTool}\` to launch 2 agents in PARALLEL (single message, two ${oldParallelTool} calls)`), "use available Codex subagents to launch two parallel checks"],
	[textRe(`use \`${oldParallelTool}\` to launch these agents in PARALLEL (single message, multiple ${oldParallelTool} calls)`), "use available Codex subagents to launch these checks in parallel"],
	[textRe(`TWO ${oldParallelTool} tool calls`), "two Codex subagent calls"],
	[textRe(`two ${oldParallelTool} calls`), "two Codex subagent calls"],
	[textRe(`multiple ${oldParallelTool} calls`), "multiple Codex subagent calls"],
];

export function adaptAgentDescription(description: string): string {
	return applyReplacements(description, DESCRIPTION_REPLACEMENTS);
}

export function adaptAgentInstructions(instructions: string): string {
	return applyReplacements(instructions, INSTRUCTION_REPLACEMENTS);
}

function applyReplacements(value: string, replacements: Array<[RegExp, string]>): string {
	return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value);
}

function textRe(value: string): RegExp {
	return new RegExp(escapeRegex(value), "g");
}

function lineRe(value: string): RegExp {
	return new RegExp(value, "g");
}

function wordRe(value: string): RegExp {
	return new RegExp(String.raw`\b${escapeRegex(value)}\b`, "g");
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
