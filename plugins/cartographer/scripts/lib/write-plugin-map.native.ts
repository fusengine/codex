/**
 * write-plugin-map.native.ts — native TS port of _legacy_py/lib/write_plugin_map.py.
 * Writes a plugin's level-2 index.md (indented linked tree) then recurses into
 * agents/skills/commands via writeTree. Reuses build-tree + merge-index +
 * write-recursive; inlined into generate_map. Output shape matches the Python.
 */
import { statSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildTree, type Row } from "./build-tree.native";
import { mergeLines } from "./merge-index.native";
import { writeTree } from "./write-recursive.native";

/** True when path is a directory. */
function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

/**
 * Write the level-2 plugin index + recurse into its sections (mirrors
 * write_plugin_map).
 * @param outputDir - Parent output directory.
 * @param pluginName - Plugin display name (subdir created under outputDir).
 * @param version - Plugin version ("" → no suffix).
 * @param items - Scanned plugin rows.
 * @param pluginPath - Source plugin directory (for section recursion).
 */
export function writePluginMap(
  outputDir: string,
  pluginName: string,
  version: string,
  items: Row[],
  pluginPath: string,
): void {
  const pluginDir = join(outputDir, pluginName);
  mkdirSync(pluginDir, { recursive: true });
  const ver = version ? ` (v${version})` : "";

  const tree = items.length ? buildTree(items, true) : "└── (empty)";
  const newLines = `# ${pluginName}${ver}\n\n${tree}`.split("\n");
  const indexPath = join(pluginDir, "index.md");
  writeFileSync(indexPath, mergeLines(newLines, indexPath).join("\n") + "\n", "utf-8");

  for (const section of ["agents", "skills", "commands"]) {
    const src = join(pluginPath, section);
    if (isDir(src)) writeTree(src, join(pluginDir, section), "../index.md");
  }
}
