/**
 * OAuth Constants - Claude Code OAuth API configuration
 *
 * @description Constants for accessing the OAuth API
 */

/** OAuth API URL for usage limits */
export const OAUTH_API_URL = "https://api.anthropic.com/api/oauth/usage";

/** Service name in the macOS Keychain */
export const KEYCHAIN_SERVICE = "Claude Code-credentials";

/** Detect Claude Code version dynamically */
function getClaudeVersion(): string {
	try {
		const proc = Bun.spawnSync(["claude", "--version"]);
		const raw = proc.stdout.toString().trim();
		const match = raw.match(/^(\d+\.\d+\.\d+)/);
		return match ? match[1] : "2.1.69";
	} catch {
		return "2.1.69";
	}
}

/** Headers required by the OAuth API */
export const OAUTH_HEADERS = {
	"anthropic-beta": "oauth-2025-04-20",
	Accept: "application/json",
	"User-Agent": `claude-code/${getClaudeVersion()}`,
} as const;

/** Success cache TTL in milliseconds (2 minutes) */
export const CACHE_TTL_MS = 120_000;

/** Error cache TTL in milliseconds (2 minutes) */
export const ERROR_CACHE_TTL_MS = 120_000;
