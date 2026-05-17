/**
 * backup.ts — Snapshot Codex config.toml before any mutation.
 * Writes `<codexHome>/config.toml.bak.<iso-timestamp>` and a stable
 * `<codexHome>/config.toml.bak` overwritten each run for quick rollback.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";

/** Backup config.toml if it exists. No-op when absent. */
export async function backupConfig(codexHome: string): Promise<void> {
	const path = join(codexHome, "config.toml");
	if (!existsSync(path)) return;

	const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const stableBak = `${path}.bak`;
	const timestampedBak = `${path}.bak.${stamp}`;

	try {
		copyFileSync(path, stableBak);
		copyFileSync(path, timestampedBak);
		p.log.info(`config.toml backed up → ${timestampedBak}`);
	} catch (e) {
		p.log.warn(`config.toml backup failed: ${(e as Error).message}`);
	}
}
