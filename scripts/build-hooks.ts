#!/usr/bin/env bun
/**
 * build-hooks.ts — bundle native-TS hooks into the @fusengine/codex-hooks package.
 *
 * Each plugin installs in isolation (~/.codex/plugins/cache/<plugin>/<ver>/) and
 * sibling plugins / plugins/_shared are NOT copied there, so a hook importing
 * cross-plugin or repo-shared code by RELATIVE path cannot resolve it at runtime.
 * Bun.build(target:'bun') INLINES every relative import, flattening that graph into
 * one self-contained bundle — this is load-bearing (see runtime-deps.ts).
 *
 * Output layout mirrors what hooks.json expects under the installed package:
 *   <pkgDir>/<plugin>/hooks/<event>/<name>.native.js
 * `all` builds every plugin into packages/codex-hooks (or a caller-supplied staging
 * dir); the installer packs that dir into a local tarball and installs it into
 * ~/.codex/node_modules. A single `<plugin>` target does a dev build to the plugin's
 * own dist/ (not shipped). Entries are opt-in: any scripts/**.ts whose first lines
 * contain `@hook-entry`. Bundled code MUST NOT use import.meta.path (broken
 * post-bundle, oven-sh/bun #15994) — read the plugin root from process.env.PLUGIN_ROOT.
 */
import { Glob } from "bun";
import { basename, dirname, join, relative } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";

const ENTRY_MARK = "@hook-entry";
const PKG_DIR = "packages/codex-hooks";

function entriesOf(pluginDir: string): string[] {
  const out: string[] = [];
  for (const rel of new Glob("scripts/**/*.ts").scanSync(pluginDir)) {
    if (rel.includes("/lib/") || rel.includes("/_legacy_py/")) continue;
    if (readFileSync(join(pluginDir, rel), "utf8").slice(0, 400).includes(ENTRY_MARK)) {
      out.push(rel);
    }
  }
  return out;
}

/** Bundle one plugin's hook entries into `<outHooksRoot>/<event>/<name>.js`. Returns count built, or -1 on failure. */
export async function buildPlugin(pluginDir: string, outHooksRoot: string): Promise<number> {
  let n = 0;
  for (const rel of entriesOf(pluginDir)) {
    const outdir = join(outHooksRoot, dirname(relative("scripts", rel)));
    mkdirSync(outdir, { recursive: true });
    const result = await Bun.build({
      entrypoints: [join(pluginDir, rel)],
      outdir,
      target: "bun",
      splitting: false,
      minify: { whitespace: true, syntax: true, identifiers: false },
      sourcemap: "none",
    });
    if (!result.success) {
      console.error(`✗ ${rel}`);
      for (const m of result.logs) console.error(m);
      return -1;
    }
    console.log(`✓ ${rel} → ${outHooksRoot}`);
    n++;
  }
  return n;
}

/** Bun's Glob skips dot-directories unless `dot:true`; the manifest lives under `.codex-plugin/`. */
function pluginDirs(root: string): string[] {
  return Array.from(new Glob("plugins/*/.codex-plugin/plugin.json").scanSync({ cwd: root, dot: true }))
    .map((p) => join(root, dirname(dirname(p))));
}

/** Build ALL plugins into the codex-hooks package (default in-repo, or a caller staging dir). */
export async function buildAll(root: string, pkgDir: string = join(root, PKG_DIR)): Promise<{ count: number; pkgDir: string }> {
  const dirs = pluginDirs(root);
  if (dirs.length === 0) throw new Error("build-hooks all: matched 0 plugins under plugins/*/.codex-plugin/ — dot-dir glob regression, refusing to ship empty");
  let count = 0;
  for (const d of dirs) {
    const n = await buildPlugin(d, join(pkgDir, basename(d), "hooks"));
    if (n < 0) throw new Error(`build-hooks: bundling failed for ${basename(d)}`);
    count += n;
  }
  return { count, pkgDir };
}

if (import.meta.main) {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: bun scripts/build-hooks.ts <plugin-name|all>");
    process.exit(2);
  }
  const root = join(import.meta.dir, "..");
  if (target === "all") {
    const { count, pkgDir } = await buildAll(root);
    console.log(`built ${count} bundles → ${pkgDir}`);
    process.exit(count > 0 ? 0 : 1);
  }
  const n = await buildPlugin(join(root, "plugins", target), join(root, "plugins", target, "dist", "hooks"));
  process.exit(n >= 0 ? 0 : 1);
}
