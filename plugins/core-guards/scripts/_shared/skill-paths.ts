/**
 * skill-paths.ts — bundle-safe TS port of _shared/scripts/skill_paths.py.
 *
 * The Codex cache nests skills under a version dir
 * (<plugin>/<version>/skills/<skill>/), so a hardcoded <plugin>/skills/... path
 * does not exist; a deny hint would point at a missing file. Resolves the latest
 * semantic-version segment. Kept dependency-free so the bundler inlines it.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readdirSync, statSync } from "node:fs";

const PLUGINS_DIR = join(homedir(), ".codex", "plugins", "cache", "fusengine-codex");

/** Semantic-version sort key (1.10.0 > 1.2.5, not lexicographic). */
function semverKey(version: string): number[] {
  return version.split(".").map((p) => (/^\d+$/.test(p) ? Number(p) : 0));
}

/** Compare two semver keys; returns positive when a > b. */
function semverCmp(a: number[], b: number[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Return the version-resolved path to <plugin>/skills/<skill>/SKILL.md.
 * @param plugin - Plugin name (cache dir under fusengine-codex).
 * @param skill - Skill slug.
 * @returns Absolute SKILL.md path (latest version, or the direct path as fallback).
 */
export function skillMd(plugin: string, skill: string): string {
  const root = join(PLUGINS_DIR, plugin);
  const rest = join("skills", skill, "SKILL.md");
  const direct = join(root, rest);
  if (existsSync(direct)) return direct;
  let versions: string[];
  try {
    versions = readdirSync(root).filter((v) => {
      try {
        return statSync(join(root, v, rest)).isFile();
      } catch {
        return false;
      }
    });
  } catch {
    return direct;
  }
  if (!versions.length) return direct;
  const best = versions.reduce((a, b) => (semverCmp(semverKey(a), semverKey(b)) >= 0 ? a : b));
  return join(root, best, rest);
}
