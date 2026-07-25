/**
 * hooks-trust.types.ts — one discovered, trust-eligible plugin hook handler.
 */

/** One command-hook handler discovered from a plugin's cached `hooks/hooks.json`. */
export interface TrustableHookEntry {
	/** Persisted `[hooks.state."<key>"]` key (`hookKey()` in hook-hash.ts). */
	key: string;
	/** `sha256:<hex>` trust hash (`computeCommandHookHash()` in hook-hash.ts). */
	hash: string;
	/** `"<pluginName>@<marketplace>"`. */
	pluginId: string;
	/** Codex PascalCase event name (`PreToolUse`, `SessionStart`, ...). */
	eventName: string;
	/** Raw (pre-substitution) command string, for the confirmation prompt/log. */
	command: string;
}
