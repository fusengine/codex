/**
 * hook-hash.ts — bit-exact reimplementation of codex-rs's hook trust identity + hash, so a
 * `trusted_hash` we compute here is byte-for-byte what the real binary recomputes on discovery
 * (hooks/src/engine/discovery.rs `command_hook_hash`, hooks/src/lib.rs `hook_key` /
 * `hook_event_key_label`; canonical-JSON + sha256 split out in hook-hash-canonical.ts).
 *
 * Verified against source at tag rust-v0.145.0. The one non-obvious behavior, confirmed by
 * reading toml_edit's `SerializeInlineTable::serialize_field` (toml-v0.8.19,
 * crates/toml_edit/src/ser/map.rs): a struct field serializing to `None` is silently OMITTED
 * from the table — never emitted as a null — regardless of `skip_serializing_if`. That is why
 * `computeCommandHookHash` below skips undefined fields entirely instead of writing them as
 * `null`.
 */
import { sha256HashOfCanonicalValue } from "./hook-hash-canonical";
import { hookEventKeyLabel } from "./hook-key";
import type { CommandHookIdentityInput } from "./hook-hash.types";

export { sha256HashOfCanonicalValue } from "./hook-hash-canonical";
export { hookEventKeyLabel, hookKey, pluginHookKeySource } from "./hook-key";

const DEFAULT_TIMEOUT_SEC = 600;
const SESSION_END_DEFAULT_TIMEOUT_SEC = 1;
const SESSION_END_MAX_TIMEOUT_SEC = 3;
const DEFAULT_ADDITIONAL_CONTEXT_LIMIT = 2_500;
const EVENTS_WITHOUT_MATCHER = new Set(["UserPromptSubmit", "Stop"]);
const EVENTS_WITH_ADDITIONAL_CONTEXT = new Set([
	"PreToolUse",
	"PostToolUse",
	"SessionStart",
	"UserPromptSubmit",
	"SubagentStart",
]);

function normalizeTimeoutSec(eventName: string, timeoutSec: number | undefined): number {
	if (eventName !== "SessionEnd") return Math.max(timeoutSec ?? DEFAULT_TIMEOUT_SEC, 1);
	return Math.min(Math.max(timeoutSec ?? SESSION_END_DEFAULT_TIMEOUT_SEC, 1), SESSION_END_MAX_TIMEOUT_SEC);
}

function normalizeAdditionalContextLimit(eventName: string, limit: number | undefined): number | undefined {
	if (!EVENTS_WITH_ADDITIONAL_CONTEXT.has(eventName)) return undefined;
	return limit === undefined || limit === DEFAULT_ADDITIONAL_CONTEXT_LIMIT ? undefined : limit;
}

/** Computes the `trusted_hash` for one command-hook handler, matching `command_hook_hash`. */
export function computeCommandHookHash(input: CommandHookIdentityInput): string {
	const matcher = EVENTS_WITHOUT_MATCHER.has(input.eventName) ? undefined : input.matcher;
	const handler: Record<string, unknown> = {
		type: "command",
		command: input.command,
		timeout: normalizeTimeoutSec(input.eventName, input.timeoutSec),
		async: input.async ?? false,
	};
	if (input.statusMessage !== undefined) handler.statusMessage = input.statusMessage;
	const limit = normalizeAdditionalContextLimit(input.eventName, input.additionalContextLimit);
	if (limit !== undefined) handler.additionalContextLimit = limit;

	const identity: Record<string, unknown> = { event_name: hookEventKeyLabel(input.eventName), hooks: [handler] };
	if (matcher !== undefined) identity.matcher = matcher;
	return sha256HashOfCanonicalValue(identity);
}
