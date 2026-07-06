/**
 * dry-duplication.ts — bundle-safe TS port of _shared/scripts/detect_duplication.py
 * + _duplication_patterns.py (merged; both well under the size limit).
 *
 * PreToolUse DRY blocker: extract long function/class names from new TS/PHP code,
 * grep the codebase for declarations, then warn (1 hit) or deny (2+). Keywords,
 * regexes, the grep flags/timeout, module-boundary filtering and the deny/warn
 * strings are verbatim with the Python so swap-in parity holds.
 */
import { extname, normalize, sep, resolve } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import type { HookInput } from "../../ai-pilot/scripts/lib/interfaces/hook.interface";
import { denyBlock } from "../../core-guards/scripts/_shared/expert-skill-gate";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

const KEYWORDS = new Set(["if", "for", "while", "switch", "catch", "return", "async",
  "new", "get", "set", "map", "run", "use", "test", "main"]);
const TS_PAT = [/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[(<]/gm,
  /(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/gm, /class\s+(\w+)\b/gm];
const PHP_PAT = [/(?:public|protected|private|static\s+)*function\s+(\w+)\s*\(/gm,
  /(?:class|interface|trait)\s+(\w+)\b/gm];
const TS_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".astro"]);
const EXCLUDE = ["--exclude-dir=vendor", "--exclude-dir=node_modules", "--exclude-dir=.next",
  "--exclude-dir=.git", "--exclude-dir=dist", "--exclude-dir=build",
  "--exclude-dir=coverage", "--exclude-dir=.turbo"];

/** modules/X/... → "X" else "" (path-segment scan, verbatim with _get_module). */
function moduleOf(fp: string): string {
  const parts = normalize(fp).split(sep);
  const i = parts.indexOf("modules");
  return i >= 0 && i + 1 < parts.length ? parts[i + 1] : "";
}

/** Extract long, non-keyword declaration names from content by extension. */
function extractNames(content: string, ext: string): Set<string> {
  const pats = TS_EXT.has(ext) ? TS_PAT : ext === ".php" ? PHP_PAT : [];
  const names = new Set<string>();
  for (const pat of pats) {
    for (const m of content.matchAll(pat)) {
      const n = m[1];
      if (!KEYWORDS.has(n) && n.length > 12) names.add(n);
    }
  }
  return names;
}

/** Grep the codebase for same-module declarations of names (1.5s budget). */
function grepDupes(names: Set<string>, cwd: string, ext: string, exclude: string): string[] {
  if (names.size === 0) return [];
  const inc = TS_EXT.has(ext)
    ? ["--include=*.ts", "--include=*.tsx", "--include=*.js", "--include=*.jsx"]
    : ["--include=*.php"];
  const decl = TS_EXT.has(ext) ? "(function|const|let|class|interface)\\s+" : "(function|class|interface|trait)\\s+";
  const escaped = [...names].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pat = `${decl}(${escaped.join("|")})\\b`;
  let out = "";
  try {
    const r = Bun.spawnSync(["grep", "-rEl", ...EXCLUDE, ...inc, "--", pat, cwd], { timeout: 1500 });
    if (r.exitedDueToTimeout) return [];
    out = r.stdout?.toString() ?? "";
  } catch {
    return [];
  }
  const ex = resolve(exclude);
  const targetMod = moduleOf(exclude);
  const matches: string[] = [];
  for (const raw of out.split("\n")) {
    const f = raw.trim();
    if (!f || resolve(f) === ex) continue;
    const dupeMod = moduleOf(f);
    if (targetMod && dupeMod && dupeMod !== targetMod) continue;
    matches.push(f);
  }
  return matches;
}

/** Run the DRY duplication blocker over a hook payload. */
export function runDuplicationGuard(data: HookInput): void {
  const cwd = (data as { cwd?: string }).cwd || process.cwd();
  for (const t of editTargets(data)) {
    const fp = t.filePath;
    const content = t.content;
    if (!content || !fp) continue;
    const ext = extname(fp).toLowerCase();
    if (!TS_EXT.has(ext) && ext !== ".php") continue;
    const names = extractNames(content, ext);
    const dupes = grepDupes(names, cwd, ext, fp);
    if (dupes.length === 0) continue;
    const preview = [...names].sort().slice(0, 5).join(", ");
    let files = dupes.slice(0, 3).join(", ");
    if (dupes.length > 3) files += ` (+${dupes.length - 3} more)`;
    if (dupes.length === 1) {
      allowPass("detect_duplication", `DRY WARNING: [${preview}] may exist in: ${files}. Check if you can reuse existing code.`);
    } else {
      denyBlock(`DRY BLOCKED: [${preview}] already exist in: ${files}. Import and reuse existing code instead of rewriting.`);
    }
  }
}
