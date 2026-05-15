/**
 * Hook I/O interfaces for Codex CLI hooks.
 * Used by all hook scripts for stdin parsing and stdout response.
 */

/** Input received by hooks from Codex CLI via stdin */
export interface HookInput {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  agent_type?: string;
  agent_transcript_path?: string;
  cwd?: string;
  session_id?: string;
  prompt?: string;
  hook_event_name?: string;
  agent_id?: string;
  type?: string;
  notification_type?: string;
  file_path?: string;
}

/** JSON output returned by hooks to Codex CLI via stdout */
export interface HookOutput {
  hookSpecificOutput?: {
    hookEventName: string;
    additionalContext?: string;
    permissionDecision?: string;
    permissionDecisionReason?: string;
  };
  additionalContext?: string;
}
