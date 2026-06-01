/**
 * hook-output.ts — bundle-safe TS port of _shared/scripts/hook_output.py +
 * the hook_log.summary/log_hook helpers it depends on. Shared by the enforce-*
 * and pre-commit guards so their PreToolUse JSON (decision, reason,
 * additionalContext, systemMessage) is byte-identical to the Python.
 */
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { mkdirSync, appendFileSync } from "node:fs";

/** CODEX_HOME or default ~/.codex (mirrors hook_log.codex_home). */
function codexHome(): string {
  return process.env.CODEX_HOME || join(homedir(), ".codex");
}

/**
 * One-line, 180-char-capped status string (mirrors hook_log.summary).
 * @param text - Source reason/context text.
 */
export function summary(text: string): string {
  const first = text ? String(text).split(/\r?\n/)[0]! : "hook event";
  return first.slice(0, 180);
}

/**
 * Append a hook event line to the Fusengine hook log (best-effort, mirrors
 * hook_log.log_hook — silently ignores write failures).
 * @param scriptName - Hook name.
 * @param detail - Detail string.
 */
export function logHook(scriptName: string, detail: string): void {
  try {
    const path = join(codexHome(), "fusengine", "logs", "hooks.log");
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${new Date().toISOString()} ${scriptName}: ${detail}\n`, "utf-8");
  } catch {
    /* ignore */
  }
}

/** Options for emitPreTool. */
interface PreToolOptions {
  context?: string;
  scriptName?: string;
}

/**
 * Emit a PreToolUse hookSpecificOutput JSON to stdout (mirrors emit_pre_tool).
 * When scriptName is set, adds systemMessage and logs the event.
 * @param decision - 'allow' or 'deny'.
 * @param reason - Decision reason shown to Codex.
 * @param opts - Optional additionalContext and scriptName.
 */
export function emitPreTool(decision: string, reason: string, opts: PreToolOptions = {}): void {
  const output: Record<string, unknown> = {
    hookEventName: "PreToolUse",
    permissionDecision: decision,
    permissionDecisionReason: reason,
  };
  if (opts.context) output.additionalContext = opts.context;
  const payload: Record<string, unknown> = { hookSpecificOutput: output };
  if (opts.scriptName) {
    payload.systemMessage = `${opts.scriptName}: ${summary(reason)}`;
    logHook(opts.scriptName, `${decision}: ${summary(reason)}`);
  }
  console.log(JSON.stringify(payload));
}
