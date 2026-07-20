/**
 * harness-solid.ts — prompt FUSE_SOLID_MAX_LINES, persisted to ~/.codex/.env.
 *
 * @fusengine/harness (dist/limits-*.mjs, resolveMaxLines) reads this var directly off
 * process.env with fallback 100 (DEFAULT_MAX_LINES) — binary-confirmed. Mirrors
 * claude-plugins' services/solid-lines.ts (promptSolidMaxLines): same 4 options, same
 * default, always offered (no opt-in gate) once the caller's harness-toggle prompt is
 * entered, since it is the single most consulted SOLID knob.
 */
import * as p from "@clack/prompts";
import { loadEnvFile, saveEnvFile } from "./env-file";

const KEY = "FUSE_SOLID_MAX_LINES";
// First option is the visual default (p.select's initialValue mirrors it).
const OPTIONS = [
	{ value: "100", label: "100 lines (strict SOLID, default)" },
	{ value: "120", label: "120 lines" },
	{ value: "150", label: "150 lines (Swift-style)" },
	{ value: "200", label: "200 lines" },
] as const;

/**
 * Prompt for the SOLID max-lines-per-file limit and persist it to ~/.codex/.env.
 * @param codexHome - Codex home directory (`~/.codex` or `$CODEX_HOME`)
 */
export async function promptSolidMaxLines(codexHome: string): Promise<void> {
	const env = loadEnvFile(codexHome);
	const choice = await p.select({
		message: "SOLID max lines per file (file-size enforcement hooks)?",
		options: OPTIONS.map((o) => ({ value: o.value, label: o.label })),
		initialValue: env[KEY] ?? "100",
	});
	if (p.isCancel(choice)) return;
	env[KEY] = choice as string;
	saveEnvFile(codexHome, env);
	p.log.success(`SOLID limit set to ${choice} lines (${KEY}=${choice})`);
}
