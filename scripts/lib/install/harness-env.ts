/**
 * harness-env.ts — opt-in @fusengine/harness runtime toggles persisted in ~/.codex/.env.
 *
 * Codex HOOK processes inherit the environment of the `codex` process itself (no
 * env_clear in codex-rs hooks/command_runner.rs); `[shell_environment_policy]` applies
 * ONLY to the agent's shell tool, never to hooks (proven by source). So the ONLY way the
 * harness hook sees a var persistently is a shell-profile export — ~/.codex/.env, sourced
 * by the loader configureShellAutoLoad installs. Mirrors perf-env.ts, writes the same file.
 */
import * as p from "@clack/prompts";
import { loadEnvFile, saveEnvFile } from "./env-file";
import { ensureHarnessMarketplace } from "./harness-marketplaces";
import { promptSolidMaxLines } from "./harness-solid";
import { promptHarnessDebug } from "./harness-debug";
import { promptHarnessSound } from "./harness-sound";
import { promptHarnessTuning } from "./harness-tuning";
import { HARNESS_ENV_OPTIONS, configureHarnessEnv, getEnabledHarnessEnv, isHarnessEnvAsked } from "./harness-env-options";

export type { HarnessEnvOption } from "./harness-env-options";
export { HARNESS_ENV_OPTIONS, configureHarnessEnv, getEnabledHarnessEnv, isHarnessEnvAsked } from "./harness-env-options";

/** Interactive prompt for harness toggles. Writes ~/.codex/.env (sourced into the shell → codex → hooks). */
export async function promptHarnessEnv(codexHome: string): Promise<void> {
	// Unconditional, not a prompt — runs before every guard below, even on repeat installs
	// that already carry the _FUSENGINE_HARNESS_ASKED marker (see harness-marketplaces.ts).
	ensureHarnessMarketplace(codexHome);

	// @clack prompts HANG forever on non-TTY/CI stdin (no throw, no cancel) — guard first.
	if (!process.stdin.isTTY || process.env.CI) {
		p.log.info("Non-interactive run — skipping harness env prompt (set RALPH_MODE/FUSE_* in ~/.codex/.env manually)");
		return;
	}
	const env = loadEnvFile(codexHome);
	if (isHarnessEnvAsked(env)) {
		p.log.info("Harness env already configured — delete _FUSENGINE_HARNESS_ASKED in ~/.codex/.env to re-prompt");
		return;
	}
	const wants = await p.confirm({ message: "Configure @fusengine/harness runtime toggles? (~/.codex/.env)", initialValue: false });
	if (p.isCancel(wants) || !wants) return;
	const choices = await p.multiselect({
		message: "Select harness toggles (TTL values are editable in ~/.codex/.env):",
		options: HARNESS_ENV_OPTIONS.map((o) => ({ value: o.key, label: o.label, hint: o.hint })),
		initialValues: getEnabledHarnessEnv(env),
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
