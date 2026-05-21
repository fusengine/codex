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
	{ name: "SERPER_API_KEY", description: "Serper — Google Search API", url: "https://serper.dev" },
	{ name: "MAGIC_API_KEY", description: "Magic 21st.dev — UI generation", url: "https://21st.dev" },
	{ name: "GEMINI_DESIGN_API_KEY", description: "Gemini — AI frontend (gemini-design-mcp)", url: "https://aistudio.google.com/apikey" },
	{ name: "NEURAL_MEMORY_HOST", description: "memory-neural — Graphiti/Qdrant host (e.g. http://localhost:8000)", url: "" },
	{ name: "GITHUB_TOKEN", description: "GitHub — repos, PRs, issues", url: "https://github.com/settings/tokens" },
	{ name: "SUPABASE_ACCESS_TOKEN", description: "Supabase — database, auth, storage", url: "https://supabase.com/dashboard/account/tokens" },
	{ name: "SLACK_TOKEN", description: "Slack — messages, channels, workspace", url: "https://api.slack.com/apps" },
	{ name: "SENTRY_AUTH_TOKEN", description: "Sentry — error tracking & debugging", url: "https://sentry.io/settings/auth-tokens" },
	{ name: "STRIPE_SECRET_KEY", description: "Stripe — payments, invoices, subscriptions", url: "https://dashboard.stripe.com/apikeys" },
	{ name: "NOTION_TOKEN", description: "Notion — pages, databases, knowledge base", url: "https://www.notion.so/my-integrations" },
	{ name: "BRAVE_API_KEY", description: "Brave Search — private web search", url: "https://brave.com/search/api" },
	{ name: "REPLICATE_API_TOKEN", description: "Replicate — run 1000+ AI models", url: "https://replicate.com/account/api-tokens" },
	{ name: "DATABASE_URL", description: "Postgres MCP — connection string", url: "" },
];
