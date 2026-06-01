/**
 * solid-read-helpers.ts — framework detection, skill-dir resolution and the
 * state-based already-read check for require-solid-read. Ported from
 * _legacy_py/pre-tool-use/require-solid-read.py (kept local, not from
 * ai-pilot/enforce-helpers, which uses import.meta.path — broken post-bundle).
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadSessionState } from "./state-manager";

const FW_MAP: Record<string, string> = { php: "php", swift: "swift", java: "java", go: "go", rb: "ruby", rs: "rust" };
export const SKILL_MAP: Record<string, string> = {
  react: "react-expert/skills/solid-react", nextjs: "nextjs-expert/skills/solid-nextjs",
  php: "laravel-expert/skills/solid-php", swift: "swift-apple-expert/skills/solid-swift",
  generic: "solid/skills/solid-generic", java: "solid/skills/solid-java",
  go: "solid/skills/solid-go", ruby: "solid/skills/solid-ruby", rust: "solid/skills/solid-rust",
};
const CACHE = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "plugins", "cache", "fusengine-codex");

/** Resolve a skill dir under the plugin cache, preferring the legacy path then
 * the latest installed version (mirrors require-solid-read.py resolve_skill_dir). */
export function resolveSkillDir(skill: string): string {
  if (!skill) return "";
  const i = skill.indexOf("/");
  if (i < 0) return join(CACHE, skill);
  const plugin = skill.slice(0, i), rest = skill.slice(i + 1);
  const legacy = join(CACHE, plugin, rest);
  if (existsSync(legacy) && statSync(legacy).isDirectory()) return legacy;
  const root = join(CACHE, plugin);
  let versions: string[] = [];
  try {
    versions = readdirSync(root).filter((v) => existsSync(join(root, v, rest)))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch { return legacy; }
  return versions.length ? join(root, versions.at(-1)!, rest) : legacy;
}

/** Framework from extension; .ts/.js families resolve to nextjs vs react by next.config. */
export function framework(fp: string): string {
  const ext = fp.includes(".") ? fp.slice(fp.lastIndexOf(".") + 1) : "";
  if (["ts", "tsx", "js", "jsx", "vue", "svelte"].includes(ext)) {
    const dir = fp.slice(0, fp.lastIndexOf("/"));
    const nx = ["next.config.js", "next.config.ts", "next.config.mjs"].some((c) => existsSync(join(dir, c)));
    return nx ? "nextjs" : "react";
  }
  return FW_MAP[ext] ?? "";
}

/** True if a SOLID read for this framework is recorded in state within 30 min. */
export function alreadyRead(sid: string, fw: string): boolean {
  let reads: unknown;
  try { reads = (loadSessionState(sid) as Record<string, unknown>).solid_reads; } catch { return false; }
  if (!Array.isArray(reads)) return false;
  const now = Date.now();
  for (let i = reads.length - 1; i >= 0; i--) {
    const r = reads[i] as Record<string, unknown>;
    if (r?.framework !== fw) continue;
    const t = Date.parse(String(r.timestamp ?? ""));
    return !Number.isNaN(t) && now - t < 1_800_000;
  }
  return false;
}
