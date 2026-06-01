/**
 * detect-plugins.native.ts — native TS port of _legacy_py/lib/detect_plugins.py.
 * Auto-detects the marketplace plugins dir containing cartographer and reads a
 * plugin's version+name from .codex-plugin/plugin.json. Dependency-free; inlined.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

/** True when path is a directory. */
function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

/** Sorted child names of a dir, or [] on failure. */
function sortedEntries(dir: string): string[] {
  try { return readdirSync(dir).sort(); } catch { return []; }
}

/**
 * Auto-detect the marketplace plugins dir containing cartographer (mirrors
 * find_marketplace_plugins). Falls back to the first plugins dir, then cwd.
 */
export function findMarketplacePlugins(): string {
  const mp = join(homedir(), ".codex", "plugins", "marketplaces");
  if (isDir(mp)) {
    for (const marketplace of sortedEntries(mp)) {
      const plugins = join(mp, marketplace, "plugins");
      if (isDir(join(plugins, "cartographer"))) return plugins;
    }
    for (const marketplace of sortedEntries(mp)) {
      const plugins = join(mp, marketplace, "plugins");
      if (isDir(plugins)) return plugins;
    }
  }
  return process.cwd();
}

/**
 * Read [version, name] from a plugin's .codex-plugin/plugin.json (mirrors
 * read_plugin_meta); ["", ""] when missing/invalid.
 * @param pluginPath - Absolute plugin directory.
 */
export function readPluginMeta(pluginPath: string): [string, string] {
  const pj = join(pluginPath, ".codex-plugin", "plugin.json");
  if (!existsSync(pj)) return ["", ""];
  try {
    const meta = JSON.parse(readFileSync(pj, "utf-8"));
    return [meta.version ?? "", meta.name ?? ""];
  } catch {
    return ["", ""];
  }
}
