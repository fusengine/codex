#!/usr/bin/env bun
// @hook-entry
/**
 * validate-tailwind.native.ts — native TS port of _legacy_py/validate-tailwind.py.
 * PostToolUse: warn on Tailwind v4 anti-patterns (@tailwind directives, @apply
 * overuse, very long classNames) for written .css/.tsx/.jsx files in a Tailwind
 * project. Reads file content from disk like the Python. Reuses shared libs.
 */
import { statSync, readFileSync } from "node:fs";
import { iterEditTargets } from "../../core-guards/scripts/_shared/track-edit-targets";
import { isTailwindProject } from "../../core-guards/scripts/_shared/expert-project-detect";
import { postPass } from "../../core-guards/scripts/_shared/hook-output-post";

let data: Parameters<typeof iterEditTargets>[0];
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const warnings: string[] = [];
for (const target of iterEditTargets(data)) {
  const filePath = target.file_path ?? "";
  if (!/\.(css|tsx|jsx)$/.test(filePath)) continue;
  try { if (!statSync(filePath).isFile()) continue; } catch { continue; }
  if (!isTailwindProject(filePath)) continue;
  let content: string;
  try { content = readFileSync(filePath, "utf-8"); } catch { continue; }

  if (filePath.endsWith(".css")) {
    if (/@tailwind (base|components|utilities)/.test(content)) {
      warnings.push("Tailwind v4: @tailwind directives are deprecated - use @import 'tailwindcss'.");
    }
    const applyCount = (content.match(/@apply/g) ?? []).length;
    if (applyCount > 10) {
      warnings.push(`Excessive @apply usage (${applyCount}) - prefer utility classes directly.`);
    }
  }
  if (/\.(tsx|jsx)$/.test(filePath)) {
    const longClasses = (content.match(/className="[^"]{150,}"/g) ?? []).length;
    if (longClasses > 0) {
      warnings.push(`Very long className (${longClasses} lines) - extract to @utility or use cn().`);
    }
  }
}

if (warnings.length) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: warnings.join(" ") },
  }));
}

postPass("validate-tailwind", "tailwind ok");
