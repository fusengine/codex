/**
 * runtime-shared.ts - Stage the `@fusengine/harness` binary in a stable
 * Fusengine runtime location under CODEX_HOME.
 *
 * The former `installRuntimeShared` (which copied `plugins/_shared/scripts` to
 * `fusengine-sys/shared/scripts`) was removed: its only runtime consumers were
 * the deleted python3 cartographer wrappers (via PYTHONPATH). Every surviving
 * consumer of `_shared/scripts` imports it by RELATIVE path, which Bun.build
 * inlines into each self-contained hook bundle — nothing reads the copied tree
 * at runtime. The harness is now the single runtime staging area.
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { installPluginDeps } from "./fs-helpers";

function shouldCopy(source: string): boolean {
	return !/(^|\/)(node_modules|\.git|\.DS_Store|__pycache__)$/.test(source);
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
 * SELF-HEALING, then HARD FAIL: `@fusengine/harness` is a repo-ROOT dependency,
 * but scanAndPrepare only runs `bun install` per-plugin — never at the root. So a
 * missing binary is first repaired with a root `bun install` (via installPluginDeps)
 * and re-checked. Only if it is STILL absent does setup abort: the Bash and
 * apply_patch guard hooks invoke ONLY this binary (native guards unwired), so a
 * missing harness means Bash/patch governance is silently off with no fallback to
 * degrade to. Aborting matches installPluginsStrict / assertInstalledState.
 */
export async function installRuntimeHarness(projectRoot: string, codexHome: string): Promise<string> {
	const src = join(projectRoot, "node_modules", "@fusengine", "harness", "dist");
	const srcBin = join(src, "cli", "bin.mjs");
	if (!(await Bun.file(srcBin).exists())) {
		p.log.info("@fusengine/harness missing — running bun install…");
		await installPluginDeps(projectRoot);
		if (!(await Bun.file(srcBin).exists())) {
			p.log.error(`@fusengine/harness still missing after bun install (${src}) — check network/registry/lockfile. The Bash and apply_patch guard hooks invoke this binary and there is no native fallback.`);
			throw new Error("@fusengine/harness missing — runtime harness staging aborted");
		}
	}
	const dest = join(codexHome, "fusengine-sys", "shared", "harness", "dist");
	await rm(dest, { recursive: true, force: true });
	await mkdir(dest, { recursive: true });
	await cp(src, dest, { recursive: true, force: true, filter: shouldCopy });
	if (!(await Bun.file(join(dest, "cli", "bin.mjs")).exists())) {
		p.log.error(`runtime harness copy incomplete — ${join(dest, "cli", "bin.mjs")} missing after staging.`);
		throw new Error("@fusengine/harness staging incomplete — bin.mjs absent in destination");
	}
	p.log.success(`runtime harness binary installed -> ${dest}`);
	return dest;
}
