/**
 * runtime-shared.ts - Install marketplace-wide shared hook scripts in a stable
 * Fusengine runtime location under CODEX_HOME.
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";

function shouldCopy(source: string): boolean {
	return !/(^|\/)(node_modules|\.git|\.DS_Store|__pycache__)$/.test(source);
}

export async function installRuntimeShared(projectRoot: string, codexHome: string): Promise<string> {
	const src = join(projectRoot, "plugins", "_shared", "scripts");
	const dest = join(codexHome, "fusengine-sys", "shared", "scripts");
	await rm(dest, { recursive: true, force: true });
	await mkdir(dest, { recursive: true });
	await cp(src, dest, { recursive: true, force: true, filter: shouldCopy });
	p.log.success(`runtime shared scripts installed -> ${dest}`);
	return dest;
}

/**
 * Stage the `@fusengine/harness` binary at a stable, offline runtime location so
 * the copied plugin hooks (which live under `$CODEX_HOME/plugins/cache/...` and
 * cannot see the repo's `node_modules`) can invoke it. Only `dist/` is copied:
 * the package has zero runtime deps (`sideEffects:false`, `files:["dist"]`), so
 * `dist/cli/bin.mjs` is a self-contained ESM binary runnable by `bun`/`node`.
 *
 * Reachability contract (keep in sync with core-guards/hooks/hooks.json): hooks
 * reference this via `${PLUGIN_ROOT}/../../../../../fusengine-sys/shared/harness/
 * dist/cli/bin.mjs` — 5 `..` because PLUGIN_ROOT is `cache/<marketplace>/<name>/
 * <version>`, exactly 5 levels below CODEX_HOME. The relative form (over an
 * absolute `$CODEX_HOME` path) avoids relying on env expansion Codex does not
 * guarantee in hook command strings — only `${PLUGIN_ROOT}` is known to expand.
 *
 * No-op (with a warning) when the dependency is absent — the strict installer
 * step still verifies plugins; a missing harness degrades to the surviving
 * native hooks rather than aborting setup.
 */
export async function installRuntimeHarness(projectRoot: string, codexHome: string): Promise<string | null> {
	const src = join(projectRoot, "node_modules", "@fusengine", "harness", "dist");
	if (!(await Bun.file(join(src, "cli", "bin.mjs")).exists())) {
		p.log.warn(`@fusengine/harness not installed (${src}) — hooks fall back to native guards`);
		return null;
	}
	const dest = join(codexHome, "fusengine-sys", "shared", "harness", "dist");
	await rm(dest, { recursive: true, force: true });
	await mkdir(dest, { recursive: true });
	await cp(src, dest, { recursive: true, force: true, filter: shouldCopy });
	p.log.success(`runtime harness binary installed -> ${dest}`);
	return dest;
}
