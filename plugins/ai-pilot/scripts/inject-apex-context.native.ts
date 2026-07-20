#!/usr/bin/env bun
// @hook-entry
/**
 * inject-apex-context.native.ts — native TS port of
 * _legacy_py/inject-apex-context.py.
 *
 * PreToolUse(Task): inject APEX rules + current task state into the sub-agent
 * prompt via hookSpecificOutput.additionalContext. Reads .codex/apex/task.json
 * under CODEX_PROJECT_DIR (or cwd); the injected context string is
 * byte-identical to the Python.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface TaskFile {
  current_task?: string | number;
  tasks?: Record<string, { subject?: string; phase?: string; doc_consulted?: Record<string, { consulted?: boolean }> }>;
}

/** Read (task_id, subject, phase, doc_status) from task.json, with defaults. */
function loadTaskState(taskFile: string): [string, string, string, string] {
  try {
    const data = JSON.parse(readFileSync(taskFile, "utf8")) as TaskFile;
    const taskId = String(data.current_task ?? "1");
    const task = data.tasks?.[taskId] ?? {};
    const consulted = Object.entries(task.doc_consulted ?? {})
      .filter(([, v]) => v && typeof v === "object" && v.consulted)
      .map(([k]) => k);
    return [taskId, task.subject ?? "", task.phase ?? "analyze", consulted.join(", ") || "none"];
  } catch {
    return ["1", "", "analyze", "none"];
  }
}

/** Build the APEX context string for injection. */
function buildContext(taskId: string, subject: string, phase: string, docs: string): string {
  return `⚠️ APEX MODE - Read .codex/apex/AGENTS.md for rules\n\n`
    + `Current: Task #${taskId} - ${subject} (Phase: ${phase})\n`
    + `Docs consulted: ${docs}\n\n`
    + `Agent must:\n`
    + `1. Read task.json → find last 3 completed tasks\n`
    + `2. Read their notes in docs/ (task-{ID}-{subject}.md)\n`
    + `3. update_plan → review/record the plan (items {step, status})\n`
    + `4. update_plan → mark the current step in_progress (one at a time) before starting\n`
    + `5. Apply SOLID (files < 100 lines)\n`
    + `6. Write notes to docs/task-{ID}-{subject}.md\n`
    + `7. update_plan → mark the step completed when done`;
}

let data: { tool_name?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (data.tool_name !== "Task") process.exit(0);

const projectRoot = process.env.CODEX_PROJECT_DIR || process.cwd();
const apexDir = join(projectRoot, ".codex", "apex");
if (!existsSync(apexDir)) process.exit(0);

const [taskId, subject, phase, docs] = loadTaskState(join(apexDir, "task.json"));
console.error(`apex: Task #${taskId} context injected`);
console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: buildContext(taskId, subject, phase, docs),
  },
}));
