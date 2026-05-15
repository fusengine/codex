/**
 * restore.ts — Restore migration scripts source paths so the migration can
 * be re-run from claude-plugins/ → codex-plugins/. The global scrub renamed
 * `.claude-plugin/` → `.codex-plugin/` and `claude-plugins` → `codex-plugins`
 * inside scripts/, which broke source-side detection.
 */
import { join } from "node:path";

export async function restoreMigrationScripts(repoRoot: string): Promise<void> {
	const migrate = join(repoRoot, "scripts", "migrate.ts");
	let m = await Bun.file(migrate).text();
	const before = m;
	m = m.replace(/codex-plugins\/plugins/g, "claude-plugins/plugins");
	if (m !== before) await Bun.write(migrate, m);

	const runner = join(repoRoot, "scripts", "lib", "runner.ts");
	let r = await Bun.file(runner).text();
	const rBefore = r;
	r = r.replace(/"\.codex-plugin"/g, '".claude-plugin"');
	if (r !== rBefore) await Bun.write(runner, r);

	console.log("[OK] migration scripts restored (source paths)");
}
