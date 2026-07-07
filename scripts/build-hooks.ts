#!/usr/bin/env bun
/**
 * build-hooks.ts — bundle native-TS hooks into the @fusengine/codex-hooks package.
 *
 * Each plugin installs in isolation (cache/<plugin>/<ver>/) with no sibling plugins or
 * plugins/_shared, so a hook importing cross-plugin/repo-shared code by RELATIVE path can't
 * resolve it at runtime. Bun.build(target:'bun') INLINES every relative import into one
 * self-contained bundle (load-bearing — see runtime-deps.ts). Output layout mirrors hooks.json:
 *   <pkgDir>/<plugin>/hooks/<event>/<name>.native.js
 * `all` builds every plugin into packages/codex-hooks; the installer packs + installs it into
 * ~/.codex/node_modules. Entries are opt-in via a `@hook-entry` marker. `quiet` silences the
 * per-file log so the setup can show a spinner instead. Bundled code MUST NOT use
 * import.meta.path (broken post-bundle, oven-sh/bun #15994) — read process.env.PLUGIN_ROOT.
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

/** Bundle one plugin's hook entries into `<outHooksRoot>/<event>/<name>.js`. Returns count, or -1 on failure. `quiet` suppresses the per-file ✓ line (build errors always print). */
export async function buildPlugin(pluginDir: string, outHooksRoot: string, quiet = false): Promise<number> {
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
    if (!quiet) console.log(`✓ ${rel} → ${outHooksRoot}`);
    n++;
  }
  return n;
}

/** Bun's Glob skips dot-directories unless `dot:true`; the manifest lives under `.codex-plugin/`. */
function pluginDirs(root: string): string[] {
  return Array.from(new Glob("plugins/*/.codex-plugin/plugin.json").scanSync({ cwd: root, dot: true }))
    .map((p) => join(root, dirname(dirname(p))));
}

/** Build ALL plugins into the codex-hooks package. `opts.quiet` silences per-file logs (setup shows a spinner instead). */
export async function buildAll(
  root: string,
  pkgDir: string = join(root, PKG_DIR),
  opts: { quiet?: boolean } = {},
): Promise<{ count: number; pkgDir: string; plugins: number }> {
  const dirs = pluginDirs(root);
  if (dirs.length === 0) throw new Error("build-hooks all: matched 0 plugins under plugins/*/.codex-plugin/ — dot-dir glob regression, refusing to ship empty");
  let count = 0;
  let plugins = 0;
  for (const d of dirs) {
    const n = await buildPlugin(d, join(pkgDir, basename(d), "hooks"), opts.quiet);
    if (n < 0) throw new Error(`build-hooks: bundling failed for ${basename(d)}`);
    count += n;
    if (n > 0) plugins++;
  }
  return { count, pkgDir, plugins };
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
