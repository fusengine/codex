#!/usr/bin/env bun
// @hook-entry
/**
 * validate-swift-solid.native.ts — native TS port of
 * _legacy_py/validate-swift-solid.py. PreToolUse-style SOLID checks on edited
 * .swift content (line limit, Protocols/ dir, @MainActor on ViewModel, Sendable
 * on async types); denies via the shared validate-solid-common helper.
 */
import { iterEditTargets } from "../../core-guards/scripts/_shared/track-edit-targets";
import { countCodeLines, denySolidViolation } from "../../core-guards/scripts/_shared/validate-solid-common";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

let data: Parameters<typeof iterEditTargets>[0];
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

for (const target of iterEditTargets(data)) {
  const filePath = target.file_path ?? "";
  if (!filePath.endsWith(".swift")) continue;
  if (/\/(\.build|DerivedData|Pods)\//.test(filePath)) continue;
  const content = target.content ?? "";
  if (!content) continue;

  const lineCount = countCodeLines(content);
  const maxLines = /(View|Screen)\.swift$/.test(filePath) ? 150 : 100;
  const violations: string[] = [];

  if (lineCount > maxLines) {
    violations.push(`File has ${lineCount} lines (limit: ${maxLines}). Extract to ViewModels, Services, or subviews.`);
  }
  if (/^protocol /m.test(content) && !filePath.includes("/Protocols/")) {
    violations.push("Protocol defined outside Protocols/ directory.");
  }
  if (filePath.endsWith("ViewModel.swift") && !content.includes("@MainActor")) {
    violations.push("ViewModel missing @MainActor annotation.");
  }
  if (/^(class|struct) .* \{/m.test(content) && content.includes("async ") && !content.includes("Sendable")) {
    violations.push("Type uses async but doesn't conform to Sendable.");
  }

  if (violations.length) denySolidViolation(filePath, violations);
}

allowPass("validate-swift-solid", "SOLID ok");
