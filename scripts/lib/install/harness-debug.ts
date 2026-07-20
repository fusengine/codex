/**
 * harness-debug.ts — prompt FUSE_HARNESS_DEBUG, persisted to ~/.codex/.env.
 *
 * @fusengine/harness (dist/cli/bin.mjs): `const hookDebug = process.env.FUSE_HARNESS_DEBUG
 * === "1"` — binary-confirmed, gates a `[hook-debug]` stderr trace of every hook payload.
 * Opt-in, off by default. Mirrors claude-plugins' services/harness-gates.ts pattern: only
 * "1" is ever written, a disabled gate is a removed key, never a written "0".
 */
import * as p from "@clack/prompts";
import { loadEnvFile, saveEnvFile } from "./env-file";

const KEY = "FUSE_HARNESS_DEBUG";

/**
 * Prompt to enable/disable harness hook debug tracing and persist to ~/.codex/.env.
 * @param codexHome - Codex home directory (`~/.codex` or `$CODEX_HOME`)
 */
export async function promptHarnessDebug(codexHome: string): Promise<void> {
	const env = loadEnvFile(codexHome);
	const enable = await p.confirm({
		message: "Enable harness hook debug tracing? (verbose stderr, off by default)",
		initialValue: env[KEY] === "1",
	});
	if (p.isCancel(enable)) return;
	if (enable) env[KEY] = "1";
	else delete env[KEY];
	saveEnvFile(codexHome, env);
	p.log.success(`Harness debug tracing ${enable ? "enabled" : "disabled"} (${KEY})`);
}
