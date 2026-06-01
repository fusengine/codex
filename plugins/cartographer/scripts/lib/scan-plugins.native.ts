/**
 * scan-plugins.native.ts — native TS port of _legacy_py/lib/scan_plugins.py.
 * Scans a plugin dir into structured [type, name, desc] rows: agents, skills,
 * commands, hooks (in that order). Reuses parse-frontmatter; inlined into
 * generate_map. Globbing, sorting and truncation match the Python.
 */
import { statSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseField, parseBodyDesc } from "./parse-frontmatter.native";
import type { Row } from "./build-tree.native";

/** Sorted *.md basenames in a dir, or [] if absent. */
function sortedMd(dir: string): string[] {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  } catch {
    return [];
  }
}

/** Filename stem (drop the final extension). */
function stem(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

/** Scan agents/*.md → ("agent", name, desc[:50]). */
function scanAgents(root: string): Row[] {
  const dir = join(root, "agents");
  return sortedMd(dir).map((f) => {
    const full = join(dir, f);
    return ["agent", parseField(full, "name") || stem(f), parseField(full, "description").slice(0, 50)] as Row;
  });
}

/** Scan skills/<dir>/SKILL.md → ("skill", dirname, desc | "(no description)"). */
function scanSkills(root: string): Row[] {
  const dir = join(root, "skills");
  let entries: string[];
  try { entries = readdirSync(dir).sort(); } catch { return []; }
  const rows: Row[] = [];
  for (const name of entries) {
    const d = join(dir, name);
    try { if (!statSync(d).isDirectory()) continue; } catch { continue; }
    const skillMd = join(d, "SKILL.md");
    let desc = "";
    try {
      if (statSync(skillMd).isFile()) desc = parseField(skillMd, "description") || parseBodyDesc(skillMd);
    } catch { /* no SKILL.md */ }
    rows.push(["skill", name, desc || "(no description)"]);
  }
  return rows;
}

/** Scan commands/*.md → ("command", "/stem", desc[:50]). */
function scanCommands(root: string): Row[] {
  const dir = join(root, "commands");
  return sortedMd(dir).map((f) => ["command", `/${stem(f)}`, parseField(join(dir, f), "description").slice(0, 50)] as Row);
}

/** Scan hooks/hooks.json → single ("hooks", "Event, Event", "") row. */
function scanHooks(root: string): Row[] {
  const file = join(root, "hooks", "hooks.json");
  try {
    const data = JSON.parse(readFileSync(file, "utf-8"));
    const hooksData = data && typeof data === "object" ? (data.hooks ?? data) : {};
    let events: string[];
    if (hooksData && !Array.isArray(hooksData) && typeof hooksData === "object") {
      events = Object.keys(hooksData).filter((k) => !k.startsWith("_")).sort();
    } else if (Array.isArray(hooksData)) {
      events = [...new Set(hooksData.map((h) => h?.event).filter(Boolean) as string[])].sort();
    } else {
      events = [];
    }
    if (events.length) return [["hooks", events.join(", "), ""]];
  } catch { /* missing/invalid */ }
  return [];
}

/**
 * Scan a plugin directory into rows (mirrors scan_plugin order).
 * @param pluginDir - Absolute plugin directory.
 */
export function scanPlugin(pluginDir: string): Row[] {
  return [...scanAgents(pluginDir), ...scanSkills(pluginDir), ...scanCommands(pluginDir), ...scanHooks(pluginDir)];
}
