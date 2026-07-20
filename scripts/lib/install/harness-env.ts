/**
 * harness-env.ts — opt-in @fusengine/harness runtime toggles persisted in ~/.codex/.env.
 *
 * Codex HOOK processes inherit the environment of the `codex` process itself (no
 * env_clear in codex-rs hooks/command_runner.rs); `[shell_environment_policy]` applies
 * ONLY to the agent's shell tool, never to hooks (proven by source). So the ONLY way the
 * harness hook sees a var persistently is a shell-profile export — ~/.codex/.env, sourced
 * by the loader configureShellAutoLoad installs. Mirrors perf-env.ts, writes the same file.
 *
 * Replayed on EVERY setup run — there is no "already asked" marker (removed: it silently
 * skipped the entire block forever after the first install, so newly-added toggles never
 * surfaced to existing installs). Currently-enabled toggles are announced via `p.note`
 * before the multiselect (whose `initialValues` already reflects them), and each opt-in
 * sub-prompt (harness-solid/-debug/-sound) applies its own keep/replace confirm for an
 * already-set key — mirrors claude-plugins' services/harness-gates.ts. The caller may pass
 * `skipEnv` (the `--skip-env` CLI flag) to opt out of the whole interactive block; the
 * marketplace registration above still always runs.
 *
 * No umbrella "do you want to configure toggles?" confirm gates the multiselect below —
 * claude-plugins' equivalent (services/harness-gates.ts, promptHarnessGates) prompts each
 * gate directly, with no such wrapper; a `p.confirm(..., initialValue:false)` here buried the
 * entire block behind a single default-No Enter keypress, which is the owner's original
 * complaint ("aucun moment ça m'a proposé de rentrer les config du harness"). Removed to
 * match the reference — a user who does not want any toggle just multiselects nothing.
 */
import * as p from "@clack/prompts";
import { loadEnvFile, saveEnvFile } from "./env-file";
import { ensureHarnessMarketplace, purgeLegacyAskedMarker } from "./harness-marketplaces";
import { promptSolidMaxLines } from "./harness-solid";
import { promptHarnessDebug } from "./harness-debug";
import { promptHarnessSound } from "./harness-sound";
import { promptHarnessTuning } from "./harness-tuning";
import { HARNESS_ENV_OPTIONS, configureHarnessEnv, getEnabledHarnessEnv } from "./harness-env-options";

export type { HarnessEnvOption } from "./harness-env-options";
export { HARNESS_ENV_OPTIONS, configureHarnessEnv, getEnabledHarnessEnv } from "./harness-env-options";

/**
 * Interactive prompt for harness toggles. Writes ~/.codex/.env (sourced into the shell →
 * codex → hooks). Replayed on every call — pass `skipEnv: true` (the `--skip-env` CLI flag)
 * to skip the interactive block; `ensureHarnessMarketplace` still always runs first.
 * @param codexHome - Codex home directory (`~/.codex` or `$CODEX_HOME`)
 * @param skipEnv - when true, skip every env prompt below (default false)
 */
export async function promptHarnessEnv(codexHome: string, skipEnv = false): Promise<void> {
	// Unconditional, not a prompt — runs before every guard below, on every setup run,
	// including --skip-env: this is the fix for the main bug, never gated (see harness-marketplaces.ts).
	ensureHarnessMarketplace(codexHome);
	purgeLegacyAskedMarker(codexHome);

	// No p.note here under skipEnv — runner-env.ts already prints the single, accurate
	// "what's skipped vs. what still runs" message for the whole env-prompt block before
	// calling us; a second note here would duplicate it (and previously contradicted it).
	if (skipEnv) return;

	// @clack prompts HANG forever on non-TTY/CI stdin (no throw, no cancel) — guard first.
	if (!process.stdin.isTTY || process.env.CI) {
		p.log.info("Non-interactive run — skipping harness env prompt (set RALPH_MODE/FUSE_* in ~/.codex/.env manually)");
		return;
	}
	const env = loadEnvFile(codexHome);
	const enabled = getEnabledHarnessEnv(env);
	if (enabled.length > 0) {
		p.note(enabled.map((k) => `  ${k}`).join("\n"), `${enabled.length} harness toggle(s) currently enabled`);
	}
	const choices = await p.multiselect({
		message: "Select harness toggles (TTL values are editable in ~/.codex/.env):",
		options: HARNESS_ENV_OPTIONS.map((o) => ({ value: o.key, label: o.label, hint: o.hint })),
		initialValues: enabled,
		required: false,
	});
	if (p.isCancel(choices)) return;
	const keys = choices as string[];
	saveEnvFile(codexHome, configureHarnessEnv(env, keys));
	p.log.success(`Harness env configured (${keys.length} toggles) → ~/.codex/.env`);

	// Extra harness knobs — not part of the fixed-preset multiselect above (a free-form
	// numeric value, an always-offered select, or path overrides don't fit that shape).
	await promptSolidMaxLines(codexHome);
	await promptHarnessDebug(codexHome);
	await promptHarnessSound(codexHome);
	await promptHarnessTuning(codexHome);
}
