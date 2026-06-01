/**
 * hook-output-post.ts — bundle-safe TS port of the allow_pass / post_pass /
 * emit_post_tool helpers from _shared/scripts/hook_output.py. Split out of
 * hook-output.ts to keep both files under the 100-line SOLID limit. Reuses
 * summary/logHook so the systemMessage + log lines stay byte-identical.
 */
import { summary, logHook } from "./hook-output";

/**
 * Emit a PostToolUse hookSpecificOutput JSON to stdout (mirrors emit_post_tool).
 * @param context - additionalContext string visible to the agent.
 * @param scriptName - Optional hook name (adds systemMessage + log line).
 */
export function emitPostTool(context: string, scriptName?: string): void {
  const payload: Record<string, unknown> = {
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context },
  };
  if (scriptName) {
    payload.systemMessage = `${scriptName}: ${summary(context)}`;
    logHook(scriptName, `post: ${summary(context)}`);
  }
  console.log(JSON.stringify(payload));
}

/**
 * Output a PreToolUse allow with systemMessage (mirrors allow_pass).
 * @param scriptName - Hook name.
 * @param detail - Status detail (default "pass").
 */
export function allowPass(scriptName: string, detail = "pass"): void {
  logHook(scriptName, `allow: ${detail}`);
  console.log(JSON.stringify({
    systemMessage: `${scriptName}: ${detail}`,
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow" },
  }));
}

/**
 * Output a PostToolUse success with systemMessage (mirrors post_pass).
 * @param scriptName - Hook name.
 * @param detail - Status detail (default "ok").
 */
export function postPass(scriptName: string, detail = "ok"): void {
  logHook(scriptName, `post: ${detail}`);
  console.log(JSON.stringify({
    systemMessage: `${scriptName}: ${detail}`,
    hookSpecificOutput: { hookEventName: "PostToolUse" },
  }));
}
