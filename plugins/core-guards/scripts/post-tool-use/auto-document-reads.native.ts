#!/usr/bin/env bun
// @hook-entry
/**
 * auto-document-reads.native.ts — native TS port of
 * _legacy_py/post-tool-use/auto-document-reads.py.
 *
 * PostToolUse(Read): when a doc-like file (SKILL/README/CLAUDE/docs/references)
 * is read, append a bullet to .codex/apex/docs/task-<id>-<fw>.md under the
 * project root. Patterns, header/bullet text, dedup and outputs match the
 * Python.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { resolveProjectRoot, detectProjectFramework } from "../_shared/track-doc";
import { utcStamp } from "../_shared/track-time";

const DOC_PATTERNS = [
  /(SKILL\.md|README\.md|CLAUDE\.md)$/, /\/docs\/.*\.md$/,
  /\/references\/.*\.md$/, /skills\/[^/]+\/SKILL\.md$/,
];
const TYPE_MAP: [string, string][] = [
  ["SKILL.md", "Skill"], ["README.md", "README"], ["AGENTS.md", "Rules"],
  ["/references/", "Reference"], ["/docs/", "Doc"],
];

let data: { tool_name?: string; tool_input?: { file_path?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const fp = data.tool_input?.file_path ?? "";
if (data.tool_name !== "Read" || !fp) process.exit(0);
if (!DOC_PATTERNS.some((p) => p.test(fp))) process.exit(0);

const root = resolveProjectRoot(dirname(fp));
if (!root) process.exit(0);
const fw = detectProjectFramework(root);

const taskFile = join(root, ".codex", "apex", "task.json");
let cur = "1";
if (existsSync(taskFile)) {
  try { cur = JSON.parse(readFileSync(taskFile, "utf-8")).current_task ?? "1"; } catch { /* ignore */ }
}

const docDir = join(root, ".codex", "apex", "docs");
mkdirSync(docDir, { recursive: true });
const docFile = join(docDir, `task-${cur}-${fw}.md`);
const ts = utcStamp();
const fname = basename(fp);
const docType = TYPE_MAP.find(([k]) => fp.includes(k))?.[1] ?? "File";
if (docType === "Skill") process.stderr.write(`skill loaded: ${basename(dirname(fp))}\n`);

if (!existsSync(docFile)) {
  const fc = fw[0].toUpperCase() + fw.slice(1);
  writeFileSync(docFile, `# Task ${cur} - ${fc} Documentation\n## Consulted: ${ts} | Source: skill:Read\n## Key Info\n\n`);
}
try {
  if (readFileSync(docFile, "utf-8").includes(`\`${fname}\``)) process.exit(0);
} catch { /* ignore */ }

appendFileSync(docFile, `- **[${docType}]** \`${fname}\` - ${ts}\n`);
console.log(JSON.stringify({ systemMessage: `📖 [${docType}] ${fname} logged` }));
process.exit(0);
