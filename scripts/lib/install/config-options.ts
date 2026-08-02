export type Choice = { value: string; label: string; hint?: string };

/**
 * Fallback reasoning-effort choices, used when a model's catalog entry
 * doesn't list `supportedReasoningEfforts`.
 *
 * Source of truth: `codex-rs/protocol/src/openai_models.rs`, enum
 * `ReasoningEffort`, which accepts the wire values `none | minimal | low |
 * medium | high | xhigh | max | ultra` (ascending order) plus an untyped
 * `Custom(String)` variant that never rejects an unknown value. The public
 * `developers.openai.com/codex/config-reference` page only documents
 * `minimal|low|medium|high|xhigh` — it lags behind the Rust source, so this
 * list follows the source, not the doc page.
 */
export const FALLBACK_EFFORTS: Choice[] = ["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]
	.map((value) => ({ value, label: value }));
export const PERSONALITIES: Choice[] = ["none", "friendly", "pragmatic"]
	.map((value) => ({ value, label: value }));
export const APPROVALS: Choice[] = [
	{ value: "untrusted", label: "untrusted", hint: "asks before everything not allowlisted" },
	{ value: "on-request", label: "on-request", hint: "the model decides when to ask (recommended)" },
	{ value: "never", label: "never", hint: "never interrupts, returns failures to the model" },
];
export const SANDBOXES: Choice[] = ["read-only", "workspace-write", "danger-full-access"]
	.map((value) => ({ value, label: value }));
export const V2_CONCURRENCY: Choice[] = ["4", "6", "8", "12", "16"]
	.map((value) => ({ value, label: value, hint: value === "4" ? "Codex default · root + 3 sub-agents" : undefined }));
