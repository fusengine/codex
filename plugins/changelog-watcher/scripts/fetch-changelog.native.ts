#!/usr/bin/env bun
// @hook-entry
/**
 * fetch-changelog.native.ts — native TS port of _legacy_py/fetch-changelog.py.
 *
 * Fetch the Codex changelog, count versions newer than the last known one,
 * persist <UTC-date>-state.json under ~/.codex/logs/00-changelog/ and emit
 * {latest,new_since_last_check,recent_versions}. URL, 10s timeout, version regex
 * (top 10), error envelope/exit code and 2-space JSON are verbatim parity.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CHANGELOG_URL = "https://developers.openai.com/codex/changelog";

const codex = process.env.CODEX_HOME ?? join(homedir(), ".codex");
const stateDir = join(codex, "logs", "00-changelog");
mkdirSync(stateDir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const stateFile = join(stateDir, `${today}-state.json`);

let changelog: string;
try {
  const resp = await fetch(CHANGELOG_URL, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) throw new Error(String(resp.status));
  changelog = await resp.text();
} catch {
  console.log(JSON.stringify({ status: "error", message: "Failed to fetch changelog" }));
  process.exit(1);
}

const versionSet = new Set<string>();
for (const match of changelog.matchAll(/Codex CLI\s+(\d+\.\d+\.\d+)/g)) versionSet.add(match[1]);
for (const match of changelog.matchAll(/@openai\/codex@(\d+\.\d+\.\d+)/g)) versionSet.add(match[1]);
for (const match of changelog.matchAll(/## v?(\d+\.\d+\.\d+)/g)) versionSet.add(match[1]);
const versions = [...versionSet].slice(0, 10);

let lastKnown = "";
if (existsSync(stateFile)) {
  try {
    lastKnown = (JSON.parse(readFileSync(stateFile, "utf-8")).last_version as string) ?? "";
  } catch {
    /* ignore */
  }
}

const latest = versions[0] ?? "";
let newCount = 0;
if (lastKnown && latest) {
  for (const v of versions) {
    if (v === lastKnown) break;
    newCount += 1;
  }
}

try {
  writeFileSync(stateFile, JSON.stringify(
    { last_version: latest, previous: lastKnown, new_versions: newCount, checked: today },
    null, 2,
  ));
} catch {
  /* best-effort */
}

console.log(JSON.stringify({
  latest, new_since_last_check: newCount, recent_versions: versions,
}));
