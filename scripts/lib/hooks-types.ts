/**
 * hooks-types.ts — shape of a Codex `hooks/hooks.json` document, shared by the
 * hook migration step ({@link transformHooks}). Split out of hooks.ts to keep
 * that module under the SOLID file-size budget. Types only: erased at build.
 */

/** A single hook entry (Codex only executes `type: "command"`). */
export interface ClaudeHookEntry {
	type: string;
	command?: string;
	prompt?: string;
	timeout?: number;
}

/** A matcher grouping the hooks it fans out to. */
export interface ClaudeHookMatcher {
	matcher?: string;
	hooks: ClaudeHookEntry[];
}

/** Source document keyed by event name. */
export interface ClaudeHooksFile {
	hooks?: Record<string, ClaudeHookMatcher[]>;
}

/** Transformed, Codex-ready document (event map always present). */
export interface CodexHooksFile {
	hooks: Record<string, ClaudeHookMatcher[]>;
}
