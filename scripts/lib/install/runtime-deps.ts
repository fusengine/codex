/**
 * runtime-deps.ts — stage the hook runtime under `$CODEX_HOME/node_modules` so plugin hooks
 * resolve exactly like Node/Claude Code (from a root node_modules).
 *
 * A root `$CODEX_HOME/package.json` pins `@fusengine/harness` (registry) and
 * `@fusengine/codex-hooks` (a LOCAL content-hash tarball built here); `bun install` then
 * materialises REAL copies (file:<tgz> copies, not symlinks — the clone can be deleted after).
 * The hooks package is bundled (build-hooks inlines cross-plugin relative imports).
 *
 * Two locations only — the repo (build workshop) and CODEX_HOME. The tarball is built in
 * packages/codex-hooks and packed straight into `$CODEX_HOME/codex-hooks-<hash>.tgz`, referenced
 * RELATIVELY (`file:./…`). NEVER tmpdir: a `/var/folders` reference in package.json dies when
 * macOS purges it. Freshness: bun's local-tarball cache is PATH-keyed (oven-sh/bun #29372), so
 * the content hash in the name guarantees a cache-miss on any change; old tarballs are cleaned.
 */
import { mkdir, rm } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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

/** Rebuild bundles in packages/codex-hooks and pack a content-hash tarball into CODEX_HOME. Returns its filename (relative to the CODEX_HOME manifest). */
async function buildAndPackHooks(projectRoot: string, codexHome: string): Promise<string> {
  const pkgDir = join(projectRoot, "packages", "codex-hooks");
  for (const e of readdirSync(pkgDir, { withFileTypes: true })) {
    if (e.isDirectory()) await rm(join(pkgDir, e.name), { recursive: true, force: true });
  }
  const s = p.spinner();
  s.start("Building hook bundles…");
  let built: { count: number; plugins: number };
  try {
    built = await buildAll(projectRoot, pkgDir, { quiet: true });
  } catch (e) {
    s.stop("hook build failed — see errors above");
    throw e;
  }
  if (built.count === 0) {
    s.stop("hook build produced 0 bundles");
    throw new Error("build-hooks produced 0 bundles — refusing to stage an empty hooks package");
  }
  s.stop(`✓ ${built.count} hook bundles built (${built.plugins} plugins)`);
  await mkdir(codexHome, { recursive: true });
  for (const old of new Bun.Glob("codex-hooks-*.tgz").scanSync(codexHome)) await rm(join(codexHome, old), { force: true });
  // --filename and --destination are mutually exclusive in bun; use --destination, then rename by hash.
  await $`cd ${pkgDir} && bun pm pack --quiet --destination ${codexHome}`.quiet();
  const packed = [...new Bun.Glob("fusengine-codex-hooks-*.tgz").scanSync(codexHome)][0];
  if (!packed) throw new Error("bun pm pack produced no tarball for the hooks package");
  const absPacked = join(codexHome, packed);
  const hash = createHash("sha256").update(readFileSync(absPacked)).digest("hex").slice(0, 16);
  const finalName = `codex-hooks-${hash}.tgz`;
  await $`mv ${absPacked} ${join(codexHome, finalName)}`.quiet();
  return finalName;
}

/** Install `@fusengine/harness` + `@fusengine/codex-hooks` into `$CODEX_HOME/node_modules`; hard-fail if either is absent afterwards. */
export async function installRuntimeDeps(projectRoot: string, codexHome: string): Promise<void> {
  const tgz = await buildAndPackHooks(projectRoot, codexHome);
  const manifest = {
    name: "codex-home-runtime",
    private: true,
    dependencies: { "@fusengine/harness": harnessRange(projectRoot), [HOOKS_PKG]: `file:./${tgz}` },
  };
  await Bun.write(join(codexHome, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
  // Drop the CODEX_HOME lockfile before installing: bun install honors the lock over the
  // manifest range, so a stale lock pins the previous harness forever (proven live: 0.1.60
  // kept after 0.1.61 shipped). The manifest is regenerated each setup and the hooks tarball
  // is content-hashed — the lock carries no information here; fresh resolution every setup.
  await rm(join(codexHome, "bun.lock"), { force: true });
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
