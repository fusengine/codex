/**
 * doc-track.ts — helpers for track-doc-consultation (port of the ai-pilot
 * _legacy_py/track_doc_helpers.py). detectFramework / acquireStateLock /
 * extractToolInfo mirror the Python; reuses the shared skillDocPathFromPayload.
 */
import { mkdirSync } from "node:fs";
import { skillDocPathFromPayload } from "../../../core-guards/scripts/_shared/shell-read-paths";

const FRAMEWORK_RULES: [RegExp, string][] = [
  [/(next|nextjs|Next)/, "nextjs"],
  [/(react|React)/, "react"],
  [/(laravel|Laravel|php|PHP)/, "laravel"],
  [/(swift|Swift|swiftui|SwiftUI)/, "swift"],
  [/(tailwind|Tailwind)/, "tailwind"],
  [/(java|Java|spring|Spring)/, "java"],
  [/\b(go|Go|golang)\b/, "go"],
  [/(ruby|Ruby|rails|Rails)/, "ruby"],
  [/(rust|Rust|cargo|Cargo)/, "rust"],
];

/** Detect framework from a query string (first matching rule, else generic). */
export function detectFramework(query: string): string {
  for (const [re, fw] of FRAMEWORK_RULES) if (re.test(query)) return fw;
  return "generic";
}

/** Acquire a lock via mkdir (atomic), retrying up to maxWait seconds. */
export async function acquireStateLock(lockDir: string, maxWait = 5): Promise<boolean> {
  let waited = 0;
  for (;;) {
    try {
      mkdirSync(lockDir);
      return true;
    } catch {
      await Bun.sleep(100);
      waited += 1;
      if (waited > maxWait * 10) return false;
    }
  }
}

interface Payload {
  tool_name?: string;
  tool_input?: { libraryId?: string; libraryName?: string; query?: string; file_path?: string };
}

/** Extract [source, query, tool] from hook data, or null to skip. */
export function extractToolInfo(data: Payload): [string, string, string] | null {
  const tool = data.tool_name ?? "";
  const ti = data.tool_input ?? {};
  if (tool.includes("context7")) return ["context7", ti.libraryId || ti.libraryName || "", tool];
  if (tool.includes("exa")) return ["exa", ti.query ?? "", tool];
  if (tool === "Read") {
    const fp = ti.file_path ?? "";
    return /skills\/.*\.md$/.test(fp) ? ["skill", fp, tool] : null;
  }
  const fp = skillDocPathFromPayload(data);
  return fp && /skills\/.*\.(md|txt)$/.test(fp) ? ["skill", fp, tool] : null;
}
