/**
 * mcp-catalog.ts — Metadata for MCP servers, ported from claude-plugins.
 * `default` tri-state: true=force preselect, false=never preselect, undefined=preselect if usable.
 */
export interface McpMeta {
	description: string;
	requiresApiKey: boolean;
	apiKeyEnv?: string;
	apiKeyUrl?: string;
	default?: boolean;
}

export const MCP_CATALOG: Record<string, McpMeta> = {
	"sequential-thinking": { description: "Step-by-step reasoning", requiresApiKey: false },
	memory: { description: "Knowledge graph persistent memory", requiresApiKey: false },
	shadcn: { description: "shadcn/ui component registry", requiresApiKey: false },
	"next-devtools": { description: "Next.js development tools", requiresApiKey: false },
	graphiti: { description: "Temporal knowledge graph", requiresApiKey: false },
	qdrant: { description: "Vector DB for semantic search", requiresApiKey: false },
	XcodeBuildMCP: { description: "Xcode build/test/simulator automation", requiresApiKey: false },
	"apple-docs": { description: "Apple dev docs + WWDC content", requiresApiKey: false },
	"astro-docs": { description: "Astro framework documentation (HTTP)", requiresApiKey: false },
	filesystem: { description: "Secure local file operations", requiresApiKey: false, default: false },
	playwright: { description: "Browser automation via accessibility tree", requiresApiKey: false },
	postgres: { description: "PostgreSQL natural-language queries", requiresApiKey: false, default: false },
	context7: { description: "Up-to-date library documentation", requiresApiKey: true, apiKeyEnv: "CONTEXT7_API_KEY", apiKeyUrl: "https://context7.com", default: true },
	exa: { description: "AI web search + research", requiresApiKey: true, apiKeyEnv: "EXA_API_KEY", apiKeyUrl: "https://exa.ai", default: true },
	magic: { description: "21st.dev UI generation", requiresApiKey: true, apiKeyEnv: "MAGIC_API_KEY", apiKeyUrl: "https://21st.dev", default: true },
	"gemini-design": { description: "Gemini AI frontend generation", requiresApiKey: true, apiKeyEnv: "GEMINI_API_KEY", apiKeyUrl: "https://aistudio.google.com/apikey", default: true },
	github: { description: "GitHub repos, PRs, issues, code review", requiresApiKey: true, apiKeyEnv: "GITHUB_TOKEN", apiKeyUrl: "https://github.com/settings/tokens" },
	supabase: { description: "Supabase database, auth, storage, migrations", requiresApiKey: true, apiKeyEnv: "SUPABASE_ACCESS_TOKEN", apiKeyUrl: "https://supabase.com/dashboard/account/tokens" },
	slack: { description: "Slack messages, channels, workspace mgmt", requiresApiKey: true, apiKeyEnv: "SLACK_TOKEN", apiKeyUrl: "https://api.slack.com/apps" },
	sentry: { description: "Sentry error tracking + debugging", requiresApiKey: true, apiKeyEnv: "SENTRY_AUTH_TOKEN", apiKeyUrl: "https://sentry.io/settings/auth-tokens" },
	stripe: { description: "Stripe payments, invoices, subscriptions", requiresApiKey: true, apiKeyEnv: "STRIPE_SECRET_KEY", apiKeyUrl: "https://dashboard.stripe.com/apikeys" },
	notion: { description: "Notion pages, databases, knowledge base", requiresApiKey: true, apiKeyEnv: "NOTION_TOKEN", apiKeyUrl: "https://www.notion.so/my-integrations" },
	"brave-search": { description: "Private web search via Brave API", requiresApiKey: true, apiKeyEnv: "BRAVE_API_KEY", apiKeyUrl: "https://brave.com/search/api" },
	replicate: { description: "Run 1000+ AI models (HTTP)", requiresApiKey: true, apiKeyEnv: "REPLICATE_API_TOKEN", apiKeyUrl: "https://replicate.com/account/api-tokens" },
};
