import { appendFile, mkdir } from "node:fs/promises";
import { outputHookResponse } from "./core";

function codexHome(): string {
  return process.env.CODEX_HOME ?? `${process.env.HOME}/.codex`;
}

function summary(reason: string): string {
  return (reason.split(/\r?\n/, 1)[0] ?? "").slice(0, 180);
}

async function logHook(scriptName: string, detail: string): Promise<void> {
  try {
    const dir = `${codexHome()}/fusengine/logs`;
    await mkdir(dir, { recursive: true });
    await appendFile(`${dir}/hooks.log`, `${new Date().toISOString()} ${scriptName}: ${detail}\n`);
  } catch {
    // Logging must never mask the hook decision.
  }
}

export async function emitPreToolDeny(scriptName: string, reason: string): Promise<void> {
  const detail = summary(reason);
  await logHook(scriptName, `deny: ${detail}`);
  outputHookResponse({
    systemMessage: `${scriptName}: ${detail}`,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  });
}
