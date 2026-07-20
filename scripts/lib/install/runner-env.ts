/**
 * runner-env.ts — the env-prompt block of runCodexSetup, split out for SRP: shell auto-load,
 * harness env toggles, and MCP server selection all gate together on `--skip-env`, while
 * `ensureHarnessMarketplace` (inside promptHarnessEnv) always runs regardless of the flag.
 */
import { join } from "node:path";
import * as p from "@clack/prompts";
import { configureShellAutoLoad } from "./shell-install";
import { promptHarnessEnv } from "./harness-env";
import { runMcpStep } from "./runner-finalize";
import type { SetupOptions } from "./runner";

/**
 * Run (or skip) the interactive env-prompt block: shell auto-load, harness env toggles, MCP
 * server selection. `ensureHarnessMarketplace` always runs, even when `opts.skipEnv` is true.
 * @param opts - setup options (`codexHome`, `projectRoot`, `skipEnv`)
 */
export async function runEnvPromptBlock(opts: SetupOptions): Promise<void> {
	if (opts.skipEnv) {
		// Single, accurate message — says what's skipped AND what still runs unconditionally.
		// A prior version of this note (and a duplicate inside promptHarnessEnv) claimed
		// "existing ~/.codex/.env values are left as-is", which was false even before this
		// LOT: ensureHarnessMarketplace/purgeLegacyAskedMarker below always mutate the file.
		p.note(
			"--skip-env: shell auto-load, the harness toggle multiselect, the SOLID/debug/" +
				"sound/tuning prompts, and MCP server selection are all skipped. The " +
				"FUSE_HARNESS_MARKETPLACES allowlist entry is still ensured and the legacy " +
				"_FUSENGINE_HARNESS_ASKED marker is still purged, unconditionally.",
			"Env prompts skipped",
		);
		await promptHarnessEnv(opts.codexHome, true);
		return;
	}
	await configureShellAutoLoad();
	await promptHarnessEnv(opts.codexHome, false);
	await runMcpStep(opts.codexHome, join(opts.projectRoot, "plugins"));
}
