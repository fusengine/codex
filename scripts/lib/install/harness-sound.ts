/**
 * harness-sound.ts — hook notification sound settings, persisted to ~/.codex/.env.
 *
 * Binary-verified in @fusengine/harness (dist/handle-*.mjs, src/runtime/notifications.ts +
 * notification-sound.ts): `FUSE_HARNESS_SOUND` is the ONLY boolean here — `soundEnabled()`
 * checks `env.FUSE_HARNESS_SOUND !== "0"` (ON by default, opt-out). The three per-kind vars
 * (`FUSE_HARNESS_SOUND_STOP/_PERMISSION/_HUMAN`) are NOT toggles: `resolveSound()` treats
 * each as an absolute-path override to a custom .mp3, falling back to the packaged asset
 * when unset or the path does not exist on disk. Corrected from the original "4 opt-out
 * toggles" brief after reading the compiled source — see the caller's report.
 */
import * as p from "@clack/prompts";
import { loadEnvFile, saveEnvFile } from "./env-file";

const MASTER_KEY = "FUSE_HARNESS_SOUND";

interface SoundOverride {
	key: string;
	label: string;
}

const OVERRIDES: readonly SoundOverride[] = [
	{ key: "FUSE_HARNESS_SOUND_STOP", label: "Custom sound file for turn-Stop (absolute path, empty = default)" },
	{ key: "FUSE_HARNESS_SOUND_PERMISSION", label: "Custom sound file for permission-needed (absolute path, empty = default)" },
	{ key: "FUSE_HARNESS_SOUND_HUMAN", label: "Custom sound file for human-needed (absolute path, empty = default)" },
];

/**
 * Prompt for the sound master toggle and optional per-kind file overrides, persisted to
 * ~/.codex/.env.
 * @param codexHome - Codex home directory (`~/.codex` or `$CODEX_HOME`)
 */
export async function promptHarnessSound(codexHome: string): Promise<void> {
	const env = loadEnvFile(codexHome);
	const keep = await p.confirm({
		message: "Keep hook notification sounds enabled? (native OS sound on Stop/permission/human events)",
		initialValue: env[MASTER_KEY] !== "0",
	});
	if (p.isCancel(keep)) return;
	if (keep) delete env[MASTER_KEY];
	else env[MASTER_KEY] = "0";

	const customize = await p.confirm({
		message: "Customize per-event sound files? (advanced, optional overrides)",
		initialValue: false,
	});
	if (!p.isCancel(customize) && customize) {
		for (const o of OVERRIDES) {
			const value = await p.text({ message: o.label, initialValue: env[o.key] ?? "" });
			if (p.isCancel(value)) continue;
			const v = value.trim();
			if (v) env[o.key] = v;
			else delete env[o.key];
		}
	}
	saveEnvFile(codexHome, env);
	p.log.success(`Harness sound settings updated (${MASTER_KEY}${keep ? " default-on" : "=0"}) → ~/.codex/.env`);
}
