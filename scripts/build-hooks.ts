#!/usr/bin/env bun
/**
 * build-hooks.ts — bundle native-TS hooks into self-contained files.
 *
 * Each plugin installs in isolation (~/.codex/plugins/cache/<plugin>/<ver>/)
 * and plugins/_shared/ is NOT copied there, so a hook importing the shared APEX
 * lib must have those imports INLINED at build time. Bun.build(target:'bun')
 * inlines every relative import and keeps node:/bun: builtins external.
 *
 * Entries are opt-in: any scripts/**.ts whose first lines contain `@hook-entry`
 * is bundled to dist/hooks/<relative>.js with a bun shebang. hooks.json is
 * repointed to the bundle ONLY after per-hook parity is proven.
 *
 * Bundled code MUST NOT use import.meta.path (broken post-bundle, oven-sh/bun
 * #15994) — read the plugin root from process.env.PLUGIN_ROOT (Codex sets it).
 */
import { Glob } from "bun";
import { dirname, join, relative } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";

const ENTRY_MARK = "@hook-entry";

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

async function buildPlugin(pluginDir: string): Promise<number> {
  for (const rel of entriesOf(pluginDir)) {
    const outdir = join(pluginDir, "dist", "hooks", dirname(relative("scripts", rel)));
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
      return 1;
    }
    console.log(`✓ ${rel} → dist/hooks/`);
  }
  return 0;
}

const target = process.argv[2];
if (!target) {
  console.error("usage: bun scripts/build-hooks.ts <plugin-name|all>");
  process.exit(2);
}
const root = join(import.meta.dir, "..");
const dirs = target === "all"
  ? Array.from(new Glob("plugins/*/.codex-plugin/plugin.json").scanSync(root))
      .map((p) => join(root, dirname(dirname(p))))
  : [join(root, "plugins", target)];

let code = 0;
for (const d of dirs) {
  code = (await buildPlugin(d)) || code;
}
process.exit(code);
