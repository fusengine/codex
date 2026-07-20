/**
 * harness-marketplaces.ts — ensure FUSE_HARNESS_MARKETPLACES includes "fusengine-codex" in
 * `${codexHome}/.env`, unconditionally and without a prompt.
 *
 * @fusengine/harness (dist/cli/bin.mjs, discoverRefs → skillParents) filters BOTH the
 * ~/.claude/plugins/cache AND ~/.codex/plugins/cache SOLID-refs scan through
 * FUSE_HARNESS_MARKETPLACES, defaulting to "fusengine-plugins" when the var is unset. Our
 * Codex marketplace is named "fusengine-codex" (see agents-resync.ts MARKETPLACE) — left
 * unset, the harness never scans ~/.codex/plugins/cache/fusengine-codex, and the SOLID-read
 * gate silently stays off on any machine with no claude-plugins install (discoverRefs' own
 * JSDoc: "with no refs the SOLID-read gate stays off" — no error, no signal).
 *
 * Mirrors claude-plugins' setHarnessRefs (services/harness-env.ts): called unconditionally,
 * outside the _FUSENGINE_HARNESS_ASKED gate, so every existing install (including ones that
 * already have the marker set) picks this up on its next setup run.
 */
import { MARKETPLACE } from "./agents-resync";
import { loadEnvFile, saveEnvFile } from "./env-file";

const KEY = "FUSE_HARNESS_MARKETPLACES";

/** Comma-separated marketplace list → trimmed, blank-free entries. */
function parseMarketplaces(value: string | undefined): string[] {
	return (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Ensure `FUSE_HARNESS_MARKETPLACES` in `${codexHome}/.env` includes "fusengine-codex".
 * Idempotent and non-destructive: an existing list is preserved and appended to, never
 * replaced outright; already-included is a true no-op (no file write at all).
 * @param codexHome - Codex home directory (`~/.codex` or `$CODEX_HOME`)
 */
export function ensureHarnessMarketplace(codexHome: string): void {
	const env = loadEnvFile(codexHome);
	const names = parseMarketplaces(env[KEY]);
	if (names.includes(MARKETPLACE)) return;
	env[KEY] = [...names, MARKETPLACE].join(",");
	saveEnvFile(codexHome, env);
}
