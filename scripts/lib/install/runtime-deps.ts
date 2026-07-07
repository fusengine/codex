/**
 * runtime-deps.ts — stage the hook runtime under `$CODEX_HOME/node_modules` so plugin
 * hooks resolve exactly like Node/Claude Code (from a root node_modules), replacing the
 * former `fusengine-sys/shared/harness` copy tree.
 *
 * A root `$CODEX_HOME/package.json` pins two deps — `@fusengine/harness` (registry) and
 * `@fusengine/codex-hooks` (a LOCAL content-hash tarball built here) — then `bun install`
 * materialises REAL copies (file:<tgz> copies rather than symlinks, so the clone can be
 * deleted afterwards). The hooks package is bundled (build-hooks inlines cross-plugin
 * relative imports), which is why the isolated per-plugin cache never needs siblings.
 *
 * Freshness: bun's local-tarball cache is keyed by PATH, not content (oven-sh/bun #29372,
 * reproduced on 1.3.14) — a fixed tarball name serves stale bundles. The tarball is named
 * by a content hash so any change yields a new path → guaranteed cache-miss.
 *
 * Upgrade path: `codex plugin update` refreshes each plugin's hooks.json from the git
 * clone, but the hook RUNTIME comes from the last setup — changing a hook means re-running
 * the setup (which rebuilds + reinstalls the tarball). Setup now needs registry access (or
 * a warm bun cache) for `@fusengine/harness`, a deliberate consequence of this model.
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { $ } from "bun";
import { installPluginDeps } from "./fs-helpers";
import { buildAll } from "../../build-hooks";

const HOOKS_PKG = "@fusengine/codex-hooks";

/** Pinned `@fusengine/harness` range from the repo root manifest (single source of truth). */
export function harnessRange(projectRoot: string): string {
  const pkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
  const range = pkg.dependencies?.["@fusengine/harness"];
  if (!range) throw new Error("@fusengine/harness absent from repo package.json dependencies — cannot pin runtime");
  return range;
}

/** Build every plugin's hooks into a tmp staging dir and pack a content-hash-named tarball. */
async function buildAndPackHooks(projectRoot: string): Promise<string> {
  const base = join(tmpdir(), "fusengine-codex-hooks");
  const stage = join(base, "pkg");
  const out = join(base, "tgz");
  await rm(base, { recursive: true, force: true });
  await mkdir(stage, { recursive: true });
  await mkdir(out, { recursive: true });
  await cp(join(projectRoot, "packages", "codex-hooks", "package.json"), join(stage, "package.json"));
  const { count } = await buildAll(projectRoot, stage);
  if (count === 0) throw new Error("build-hooks produced 0 bundles — refusing to stage an empty hooks package");
  await $`cd ${stage} && bun pm pack --destination ${out}`.quiet();
  const raw = [...new Bun.Glob("*.tgz").scanSync(out)][0];
  if (!raw) throw new Error("bun pm pack produced no tarball for the hooks package");
  const abs = join(out, raw);
  const hash = createHash("sha256").update(readFileSync(abs)).digest("hex").slice(0, 16);
  const finalTgz = join(out, `codex-hooks-${hash}.tgz`);
  if (abs !== finalTgz) await $`mv ${abs} ${finalTgz}`.quiet();
  p.log.info(`hooks package packed (${count} bundles) → ${finalTgz}`);
  return finalTgz;
}

/** Install `@fusengine/harness` + `@fusengine/codex-hooks` into `$CODEX_HOME/node_modules`; hard-fail if either is absent afterwards. */
export async function installRuntimeDeps(projectRoot: string, codexHome: string): Promise<void> {
  const tgz = await buildAndPackHooks(projectRoot);
  const manifest = {
    name: "codex-home-runtime",
    private: true,
    dependencies: { "@fusengine/harness": harnessRange(projectRoot), [HOOKS_PKG]: `file:${tgz}` },
  };
  await Bun.write(join(codexHome, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
  if (!(await installPluginDeps(codexHome))) {
    throw new Error(`bun install failed in ${codexHome} — runtime deps not staged`);
  }
  const harnessBin = join(codexHome, "node_modules", "@fusengine", "harness", "dist", "cli", "bin.mjs");
  const hooksPkg = join(codexHome, "node_modules", "@fusengine", "codex-hooks");
  if (!existsSync(harnessBin)) {
    throw new Error(`@fusengine/harness missing after install (${harnessBin}) — Bash/apply_patch guards would be off, aborting`);
  }
  if (!existsSync(hooksPkg)) {
    throw new Error(`@fusengine/codex-hooks missing after install (${hooksPkg}) — plugin hooks would fail module resolution, aborting`);
  }
  await rm(join(codexHome, "fusengine-sys"), { recursive: true, force: true });
  p.log.success(`runtime staged → ${join(codexHome, "node_modules")} (harness + codex-hooks); legacy fusengine-sys cleaned`);
}
