#!/usr/bin/env bun
// @hook-entry
/**
 * validate-laravel-solid.native.ts — native TS port of
 * _legacy_py/validate-laravel-solid.py.
 *
 * PostToolUse: for each edited .php file (vendor skipped) flag SOLID violations
 * — over 100 lines, interface outside Contracts/, or a fat controller (>80
 * lines). countCodeLines / denySolidViolation are the shared ports (identical
 * to the Python's inline versions, incl. the PreToolUse deny event name).
 */
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import { countCodeLines, denySolidViolation } from "../../core-guards/scripts/_shared/validate-solid-common";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

let data: Parameters<typeof editTargets>[0];
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

for (const t of editTargets(data)) {
  const filePath = t.filePath;
  if (!filePath.endsWith(".php") || filePath.includes("/vendor/")) continue;
  const content = t.content;
  if (!content) continue;

  const lineCount = countCodeLines(content);
  const violations: string[] = [];
  if (lineCount > 100) {
    violations.push(`File has ${lineCount} lines (limit: 100). Split using Services, Actions, or Traits.`);
  }
  if (/^interface /m.test(content) && !filePath.includes("/Contracts/")) {
    violations.push("Interface defined outside Contracts/. Move to app/Contracts/ or FuseCore/{Module}/App/Contracts/.");
  }
  if (filePath.includes("/Controllers/") && lineCount > 80) {
    violations.push(`Fat controller (${lineCount} lines). Extract logic to Services or Actions.`);
  }
  if (violations.length) denySolidViolation(filePath, violations);
}
allowPass("validate-laravel-solid", "SOLID ok");
