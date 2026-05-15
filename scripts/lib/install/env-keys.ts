/**
 * env-keys.ts — Catalog of MCP API keys (name + description + signup URL).
 * Each plugin .mcp.json declares ${VAR} placeholders Codex resolves from
 * process.env at MCP server boot.
 */
export interface EnvKey {
	name: string;
	description: string;
	url: string;
}

export const API_KEYS: EnvKey[] = [
	{ name: "CONTEXT7_API_KEY", description: "Context7 — documentation lookup", url: "https://context7.com" },
	{ name: "EXA_API_KEY", description: "Exa — AI web search & research", url: "https://exa.ai" },
	{ name: "MAGIC_API_KEY", description: "Magic 21st.dev — UI generation", url: "https://21st.dev" },
	{ name: "GEMINI_API_KEY", description: "Gemini — AI frontend (gemini-design-mcp)", url: "https://aistudio.google.com/apikey" },
	{ name: "NEURAL_MEMORY_HOST", description: "memory-neural — Graphiti/Qdrant host (e.g. http://localhost:8000)", url: "" },
	{ name: "GITHUB_TOKEN", description: "GitHub — repos, PRs, issues", url: "https://github.com/settings/tokens" },
];
