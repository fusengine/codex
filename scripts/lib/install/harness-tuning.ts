/**
 * harness-tuning.ts — opt-in advanced harness TTL/cache knobs, persisted to ~/.codex/.env.
 *
 * Both keys below are read straight off process.env by the compiled harness (no FUSE_/non-
 * FUSE_ routing split needed on Codex — .env is the ONLY persistence layer hooks inherit
 * from, per harness-env.ts's own header note). Mirrors claude-plugins' services/harness-
 * tuning.ts (promptHarnessTuning): opt-in confirm, then one prefilled p.text per field,
 * persisted only when it differs from the default so an untouched run stays clean.
 */
import * as p from "@clack/prompts";
import { loadEnvFile, saveEnvFile } from "./env-file";

interface Field {
	key: string;
	label: string;
	def: string;
}

const TUNING: readonly Field[] = [
	{ key: "FUSE_LESSONS_THROTTLE_MIN", label: "Lessons write-reminder throttle (minutes)", def: "5" },
	{ key: "FUSENGINE_CACHE_TTL_MIN", label: "Subagent context cache TTL (minutes)", def: "30" },
];

/** Reject anything that is not a whole number (empty allowed → falls back to default). */
function numericValidator(v: string | undefined): string | undefined {
	const s = (v ?? "").trim();
	return s === "" || /^\d+$/.test(s) ? undefined : "Enter a whole number";
}

/**
 * Prompt for advanced harness tuning (TTLs, caches). Opt-in and defaults to skipped; only
 * values differing from the defaults are persisted.
 * @param codexHome - Codex home directory (`~/.codex` or `$CODEX_HOME`)
 */
export async function promptHarnessTuning(codexHome: string): Promise<void> {
	const wants = await p.confirm({
		message: "Configure advanced harness tuning? (TTLs, caches — sane defaults otherwise)",
		initialValue: false,
	});
	if (p.isCancel(wants) || !wants) return;

	const env = loadEnvFile(codexHome);
	for (const f of TUNING) {
		const value = await p.text({
			message: f.label,
			initialValue: env[f.key] ?? f.def,
			validate: numericValidator,
		});
		if (p.isCancel(value)) continue;
		const v = value.trim();
		if (v && v !== f.def) env[f.key] = v;
		else delete env[f.key];
	}
	saveEnvFile(codexHome, env);
	p.log.success("Harness tuning updated → ~/.codex/.env");
}
