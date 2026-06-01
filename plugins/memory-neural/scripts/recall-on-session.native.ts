#!/usr/bin/env bun
// @hook-entry
/**
 * recall-on-session.native.ts — native TS port of _legacy_py/recall-on-session.py.
 *
 * SessionStart: detect project type from cwd markers, POST a Graphiti /search
 * for "<type> <name> common errors" (5 results) and, if results come back,
 * print a <neural-memory-recall> block. The detection here uses this hook's own
 * node/php/swift/rust/go/python mapping (distinct from the APEX framework
 * detector), kept local for verbatim parity. Query, log line and block verbatim.
 */
import { existsSync, appendFileSync } from "node:fs";
import { basename } from "node:path";
import { graphitiUrl, utcTs, memoryLogDir } from "./lib/neural";

/** Detect language/runtime from cwd markers (memory-neural's own mapping). */
function detectMemoryProjectType(): string {
  const checks: [string, string][] = [
    ["package.json", "node"], ["composer.json", "php"],
    ["Package.swift", "swift"], ["Cargo.toml", "rust"], ["go.mod", "go"],
  ];
  for (const [f, t] of checks) if (existsSync(f)) return t;
  if (existsSync("requirements.txt") || existsSync("pyproject.toml")) return "python";
  return "unknown";
}

const logDir = memoryLogDir();
const projectType = detectMemoryProjectType();
const projectName = basename(process.cwd());

let searchResult = "";
try {
  const resp = await fetch(graphitiUrl("/search"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: `${projectType} ${projectName} common errors`, num_results: 5 }),
    signal: AbortSignal.timeout(5_000),
  });
  searchResult = await resp.text();
} catch {
  /* offline — ignored */
}

try {
  appendFileSync(`${logDir}/recalls.log`, `[${utcTs()}] session_recall | ${projectType} | ${projectName}\n`);
} catch { /* ignore */ }

if (searchResult) {
  try {
    const results = (JSON.parse(searchResult).results ?? []) as Array<{ content?: string; name?: string }>;
    if (results.length) {
      const lessons = results.slice(0, 5).map((r) => `- ${r.content || r.name || "unknown"}`).join("\n");
      console.log(`<neural-memory-recall project="${projectName}" type="${projectType}">`);
      console.log("Relevant lessons from past sessions:");
      console.log(lessons);
      console.log("For deeper search: use mcp__qdrant__qdrant-find with project-specific queries.");
      console.log("</neural-memory-recall>");
    }
  } catch { /* malformed JSON — ignored */ }
}
