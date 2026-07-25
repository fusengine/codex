/**
 * hook-hash.types.ts — shapes for the already-Codex-format `hooks/hooks.json` cached under
 * `${codexHome}/plugins/cache/<marketplace>/<plugin>/<version>/`, and the input to the
 * bit-exact `trusted_hash` computation in hook-hash.ts.
 */

/** One `hooks/hooks.json` handler entry (only `type: "command"` is hashed/trusted). */
export interface HooksJsonCommandHandler {
	type: string;
	command?: string;
	commandWindows?: string;
	timeout?: number;
	async?: boolean;
	statusMessage?: string;
	additionalContextLimit?: number;
}

/** One matcher group: an optional matcher pattern plus the handlers it fans out to. */
export interface HooksJsonMatcherGroup {
	matcher?: string;
	hooks: HooksJsonCommandHandler[];
}

/** The event map keyed by Codex PascalCase event name (`PreToolUse`, `SessionStart`, ...). */
export type HooksJsonEvents = Record<string, HooksJsonMatcherGroup[]>;

/** Parsed `hooks/hooks.json` document. */
export interface HooksJsonFile {
	description?: string;
	hooks: HooksJsonEvents;
}

/** Input to {@link computeCommandHookHash} for one discovered command-hook handler. */
export interface CommandHookIdentityInput {
	eventName: string;
	matcher?: string;
	command: string;
	timeoutSec?: number;
	async?: boolean;
	statusMessage?: string;
	additionalContextLimit?: number;
}
