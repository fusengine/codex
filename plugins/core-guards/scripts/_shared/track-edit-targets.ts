/**
 * track-edit-targets.ts — native TS port of plugins/_shared/scripts/edit_targets.py
 * (the parts the tracking post-hooks need: iterEditTargets).
 *
 * Returns Write/Edit/apply_patch file targets from a hook payload, parsing the
 * Codex apply_patch V4A command the same way the Python does. Kept local to
 * core-guards so the bundler can inline it (no import.meta.path).
 */

/** A single edited file target extracted from a hook payload. */
export interface EditTarget {
  file_path: string;
  content: string;
  action: string;
}

interface Payload {
  tool_name?: string;
  tool_input?: {
    file_path?: string;
    content?: string;
    new_string?: string;
    command?: string;
    input?: string;
    patch?: string;
  };
}

/** Parse a Codex apply_patch V4A command into edited file targets. */
function parseApplyPatch(command: string): EditTarget[] {
  const targets: EditTarget[] = [];
  let filePath = "";
  let action = "";
  let added: string[] = [];
  const flush = (): void => {
    if (filePath && action !== "Delete") {
      targets.push({ file_path: filePath, content: added.join("\n"), action });
    }
  };
  for (const line of command.split("\n")) {
    const m = line.match(/^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$/);
    if (m) {
      flush();
      action = m[1];
      filePath = m[2].trim();
      added = [];
      continue;
    }
    if ((action === "Add" || action === "Update") && line.startsWith("+") && !line.startsWith("+++")) {
      added.push(line.slice(1));
    }
  }
  flush();
  return targets;
}

/**
 * Return Write/Edit/apply_patch targets from a hook payload.
 *
 * @param data - Parsed hook event payload.
 * @returns List of edited file targets (empty for non-edit tools).
 */
export function iterEditTargets(data: Payload): EditTarget[] {
  const tool = data.tool_name;
  const ti = data.tool_input ?? {};
  if (tool === "apply_patch") {
    const command = String(ti.command || ti.input || ti.patch || "");
    return parseApplyPatch(command);
  }
  if (tool !== "Write" && tool !== "Edit") return [];
  const filePath = String(ti.file_path || "");
  if (!filePath) return [];
  const content = String(ti.content || ti.new_string || "");
  return [{ file_path: filePath, content, action: tool }];
}
