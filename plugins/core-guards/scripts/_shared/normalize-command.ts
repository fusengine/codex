/**
 * normalize-command.ts — normalizes `tool_input.command` across harnesses.
 *
 * Claude Code/Cursor/Hermes send `command` as a plain string. Codex CLI's
 * `shell` tool instead sends a string[] argv (observed live:
 * ["bash","-lc","git commit -m test"]), which crashed every guard reading
 * `.command` as a string (`cmd.startsWith is not a function`). All guards
 * must route through this single normalizer instead of reading the raw field.
 */

/**
 * Normalize a raw `tool_input.command` payload to a plain shell-command
 * string, no-op on the string shape so existing string-payload harnesses are
 * unaffected.
 * @param input - Raw `tool_input.command` value from the hook payload.
 * @returns The command string, or "" if the shape is unrecognized.
 */
export function normalizeCommand(input: unknown): string {
  if (typeof input === "string") return input;
  if (Array.isArray(input) && input.every((part) => typeof part === "string")) {
    if (input.length === 3 && (input[1] === "-lc" || input[1] === "-c")) {
      return input[2] as string;
    }
    return input.join(" ");
  }
  return "";
}
