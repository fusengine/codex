#!/usr/bin/env bun
// @hook-entry
/**
 * read-agents-md.native.ts — native TS port of
 * _legacy_py/user-prompt/read-claude-md.py.
 *
 * UserPromptSubmit: inject ~/.codex/AGENTS.md as additionalContext, prefixed
 * with an APEX instruction when the prompt contains a dev verb. Dev-verb regex
 * (with accents), project detection, the APEX text and the envelope are verbatim
 * from the Python for strict parity. Logs to hooks.log like the Python.
 */
import { existsSync, statSync, readFileSync, mkdirSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CODEX = process.env.CODEX_HOME ?? join(homedir(), ".codex");
const LOG_FILE = join(CODEX, "fusengine", "logs", "hooks.log");
const DEV_VERBS = /(cr[ée]er|impl[ée]menter|ajouter|d[ée]velopper|construire|build|refactor|migrer|implement|create|add|develop)/i;

/** Append a timestamped UserPromptSubmit line to hooks.log (best-effort). */
function log(msg: string): void {
  try {
    mkdirSync(join(CODEX, "fusengine", "logs"), { recursive: true });
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    appendFileSync(LOG_FILE, `[${ts}] [UserPromptSubmit/read-claude-md] ${msg}\n`);
  } catch { /* ignore */ }
}

/** Detect project type from cwd markers (mirrors detect_project_type). */
function detectProjectType(): string {
  if (existsSync("package.json")) {
    try {
      const content = readFileSync("package.json", "utf-8");
      if (content.includes("next")) return "nextjs";
      if (content.includes("react")) return "react";
    } catch { /* ignore */ }
  }
  if (existsSync("composer.json") && existsSync("artisan")) return "laravel";
  if (existsSync("Package.swift")) return "swift";
  return "generic";
}

/** APEX workflow instruction block (verbatim from build_apex_instruction). */
function buildApexInstruction(pt: string): string {
  return `INSTRUCTION: This is a development task. Use APEX methodology:\n\n`
    + `**TRACKING FILE**: [project]/.codex/apex/task.json\n\n`
    + `1. **ANALYZE** (3 AGENTS IN PARALLEL):\n`
    + `   - explore-codebase + research-expert + general-purpose\n`
    + `   - Project type: ${pt}\n\n`
    + `2. **PLAN**: TaskCreate (<100 lines per file)\n\n`
    + `3. **EXECUTE**: ${pt}-expert, SOLID principles\n\n`
    + `4. **EXAMINE**: Run sniper agent after ANY modification`;
}

let data: { userPrompt?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const prompt = data.userPrompt ?? "";
const agentsMd = join(homedir(), ".codex", "AGENTS.md");
if (!existsSync(agentsMd) || !statSync(agentsMd).isFile()) {
  log("ERROR: AGENTS.md not found");
  process.exit(0);
}
let content: string;
try {
  content = readFileSync(agentsMd, "utf-8");
} catch {
  process.exit(0);
}
process.stderr.write("memory: AGENTS.md loaded\n");

let apex = "";
if (DEV_VERBS.test(prompt)) {
  const pt = detectProjectType();
  apex = buildApexInstruction(pt);
  log(`APEX auto-triggered for dev task (project: ${pt})`);
}
const full = apex ? `${apex}\n\n# AGENTS.md\n${content}` : `# AGENTS.md\n${content}`;
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: full },
}));
log(`AGENTS.md injected${apex ? "+ APEX" : ""}`);
process.exit(0);
