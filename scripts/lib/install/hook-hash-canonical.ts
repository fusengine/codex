/**
 * hook-hash-canonical.ts — canonical-JSON + sha256 half of `version_for_toml`
 * (config/src/fingerprint.rs), split out of hook-hash.ts to stay under the SOLID line budget.
 */
import { createHash } from "node:crypto";

/** Recursively sorts object keys (byte order); arrays keep their order (`canonical_json`). */
function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (value !== null && typeof value === "object") {
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(value as Record<string, unknown>).sort()) {
			sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
		}
		return sorted;
	}
	return value;
}

/** Canonicalizes then hashes a value exactly like `version_for_toml`: sha256 of compact JSON. */
export function sha256HashOfCanonicalValue(value: unknown): string {
	const json = JSON.stringify(canonicalize(value));
	return `sha256:${createHash("sha256").update(json, "utf8").digest("hex")}`;
}
