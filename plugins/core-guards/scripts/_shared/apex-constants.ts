/** Shared constants for APEX sub-agent tracking hooks. */

export const RESEARCH_TOOLS = new Set<string>([
	"mcp__context7__query-docs",
	"mcp__context7__resolve-library-id",
	"mcp__exa__web_search_exa",
	"mcp__exa__get_code_context_exa",
	"mcp__exa__deep_researcher_start",
	"WebSearch",
	"WebFetch",
]);

/** Codex sanitizes `-` → `_` across the full MCP tool id; accept that form too. */
export const RESEARCH_TOOLS_CODEX = new Set<string>(
	[...RESEARCH_TOOLS].map((t) => t.replaceAll("-", "_")),
);

export const EXPLORE_TOOLS = new Set<string>(["Glob", "Grep"]);

export const EXPLORE_BASH_CMDS = new Set<string>([
	"grep", "rg", "find", "ls", "fd", "ast-grep", "tree", "cat", "head", "tail",
]);

export const CACHE_READ_RE = /\/context\/mcp\/(exa-search|exa-code-context|context7-)/;
