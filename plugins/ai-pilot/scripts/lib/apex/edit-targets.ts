import type { HookInput } from "../interfaces/hook.interface";
import { asRecord } from "../../../../core-guards/scripts/_shared/as-record";

export type EditTarget = {
  filePath: string;
  content: string;
  isTrivialEdit: boolean;
};

function parseApplyPatch(body: string): EditTarget[] {
  const targets: EditTarget[] = [];
  let filePath = "";
  let action = "";
  let added: string[] = [];

  const flush = (): void => {
    if (!filePath || action === "Delete") return;
    targets.push({ filePath, content: added.join("\n"), isTrivialEdit: action === "Update" && added.length < 5 });
  };

  for (const line of body.split("\n")) {
    const match = line.match(/^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$/);
    if (match) {
      flush();
      action = match[1] ?? "";
      filePath = (match[2] ?? "").trim();
      added = [];
    } else if ((action === "Add" || action === "Update") && line.startsWith("+") && !line.startsWith("+++")) {
      added.push(line.slice(1));
    }
  }
  flush();
  return targets;
}

export function editTargets(input: HookInput | unknown): EditTarget[] {
  const data = asRecord(input);
  if (!data) return [];
  const toolName = typeof data.tool_name === "string" ? data.tool_name : "";
  const toolInput = asRecord(data.tool_input) ?? {};
  if (toolName === "apply_patch") {
    return parseApplyPatch(String(toolInput.command ?? toolInput.input ?? toolInput.patch ?? ""));
  }
  if (toolName !== "Write" && toolName !== "Edit") return [];
  const filePath = String(toolInput.file_path ?? "");
  if (!filePath) return [];
  const content = String(toolInput.content ?? toolInput.new_string ?? "");
  const replaceAll = Boolean(toolInput.replace_all);
  return [{
    filePath,
    content,
    isTrivialEdit: toolName === "Edit" && !replaceAll && content.split("\n").length < 5,
  }];
}
