import { afterEach, expect, test } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanupRoots, runHook, tempRoot } from "../../core-guards/scripts/_shared/tests/hook-process";
import type { HookConfig } from "../../core-guards/scripts/_shared/tests/hook-process.types";

const script = join(import.meta.dir, "validate-seo.ts");
const hooksFile = join(import.meta.dir, "..", "hooks", "hooks.json");

afterEach(cleanupRoots);

test.each(["{", "null", "[]", "42", '"scalar"'])("payload %s is ignored", async (stdin) => {
  expect(await runHook(script, stdin, { cwd: tempRoot("seo-invalid-") }))
    .toEqual({ exitCode: 0, stdout: "", stderr: "" });
});

test("wrong cwd is ignored", async () => {
  const root = tempRoot("seo-cwd-");
  const file = join(root, "page.html");
  writeFileSync(file, "<html></html>");
  const stdin = JSON.stringify({ cwd: join(root, "missing"), tool_input: { file_path: file } });
  expect(await runHook(script, stdin, { cwd: root }))
    .toEqual({ exitCode: 0, stdout: "", stderr: "" });
});

test("apply_patch emits PostToolUse context with exit zero", async () => {
  const root = tempRoot("seo-project-");
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, ".fuse-seo"), "");
  const file = join(root, "src", "page.html");
  writeFileSync(file, "<html><head></head><body></body></html>");
  const stdin = JSON.stringify({ cwd: root, tool_name: "apply_patch", tool_input: { file_path: file } });
  const result = await runHook(script, stdin, { cwd: root, codexHome: join(root, ".codex") });

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  const output = JSON.parse(result.stdout);
  expect(output.hookSpecificOutput.hookEventName).toBe("PostToolUse");
  expect(output.hookSpecificOutput.additionalContext).toContain("missing SEO elements");
  expect(output.hookSpecificOutput.additionalContext).toContain("<title>");
});

test("SEO hook matcher is apply_patch", () => {
  const config = JSON.parse(readFileSync(hooksFile, "utf-8")) as HookConfig;
  expect(config.hooks.PostToolUse).toHaveLength(1);
  expect(config.hooks.PostToolUse?.[0]?.matcher).toBe("apply_patch");
});
