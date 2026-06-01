#!/usr/bin/env bun
// @hook-entry
/**
 * security-scan.native.ts — native TS port of _legacy_py/security-scan.py.
 * CLI (not a lifecycle hook): detect language, grep each pattern, emit the same
 * JSON summary+findings. STRICT parity: identical grep invocation (BRE pattern
 * passed verbatim), skip filter, severity counts, indent=2 output.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getPatterns, type ScanPattern } from "./security-scan-patterns.native";

const SKIP_RE = /(node_modules|vendor|\.git|dist|build)/;

/** Detect project language from config files (mirrors detect_language, order kept). */
function detectLanguage(projectDir: string): string {
  const checks: [string, string][] = [
    ["package.json", "javascript"], ["composer.json", "php"],
    ["requirements.txt", "python"], ["pyproject.toml", "python"],
    ["Package.swift", "swift"], ["go.mod", "go"], ["Cargo.toml", "rust"],
  ];
  for (const [filename, lang] of checks) {
    if (existsSync(join(projectDir, filename))) return lang;
  }
  return "unknown";
}

interface Finding { severity: string; category: string; pattern: string; file: string; line: string; }

/** Grep files matching glob for a pattern, mapping hits to findings. */
function scanPattern(projectDir: string, p: ScanPattern): Finding[] {
  const [severity, category, pattern, glob] = p;
  const findings: Finding[] = [];
  const r = Bun.spawnSync(["grep", "-rn", pattern, `--include=${glob}`, "."], {
    cwd: projectDir, stdout: "pipe", stderr: "pipe",
  });
  for (const line of new TextDecoder().decode(r.stdout).split("\n")) {
    if (!line) continue;
    const parts = line.split(":");
    if (parts.length < 2) continue;
    const [fpath, lineno] = [parts[0]!, parts[1]!];
    if (SKIP_RE.test(fpath)) continue;
    findings.push({ severity, category, pattern, file: fpath, line: lineno });
  }
  return findings;
}

const projectDir = process.argv[2] ?? ".";
const lang = detectLanguage(projectDir);
const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
const allFindings: Finding[] = [];
for (const p of getPatterns(lang)) {
  const f = scanPattern(projectDir, p);
  allFindings.push(...f);
  const key = p[0].toLowerCase();
  counts[key] = (counts[key] ?? 0) + f.length;
}
const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(JSON.stringify({
  language: lang,
  directory: projectDir,
  summary: { ...counts, total },
  findings: allFindings,
}, null, 2));
