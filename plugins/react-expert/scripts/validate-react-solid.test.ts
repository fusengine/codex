import { afterEach, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanupRoots, runHook, tempRoot } from "../../core-guards/scripts/_shared/tests/hook-process";
import type { HookConfig } from "../../core-guards/scripts/_shared/tests/hook-process.types";

const script = join(import.meta.dir, "validate-react-solid.native.ts");
const hooksFile = join(import.meta.dir, "..", "hooks", "hooks.json");

afterEach(cleanupRoots);

function reactRoot(): string {
  const root = tempRoot("react-solid-");
  writeFileSync(join(root, "package.json"), JSON.stringify({ dependencies: { react: "19.2.0" } }));
  return root;
}

test.each(["{", "null", "[]", "42", '"scalar"'])("payload %s is ignored", async (stdin) => {
  expect(await runHook(script, stdin, { cwd: reactRoot() }))
    .toEqual({ exitCode: 0, stdout: "", stderr: "" });
});

test("non-React cwd is ignored", async () => {
  const root = tempRoot("react-wrong-cwd-");
  expect(await runHook(script, JSON.stringify({ tool_name: "apply_patch" }), { cwd: root }))
    .toEqual({ exitCode: 0, stdout: "", stderr: "" });
});

test("apply_patch denial uses PreToolUse", async () => {
  const declaration = "export " + "inter" + "face CardProps {}";
  const patch = `*** Begin Patch\n*** Add File: src/components/Card.tsx\n+${declaration}\n*** End Patch`;
  const result = await runHook(script, JSON.stringify({
    tool_name: "apply_patch",
    tool_input: { patch },
  }), { cwd: reactRoot() });

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(JSON.parse(result.stdout).hookSpecificOutput).toMatchObject({
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
  });
});

test("React writes use the canonical Harness core route", () => {
  const config = JSON.parse(readFileSync(hooksFile, "utf-8")) as HookConfig;
  const pre = config.hooks.PreToolUse ?? [];
  const post = config.hooks.PostToolUse ?? [];
  const harnessCore = (entry: HookConfig["hooks"][string][number]): boolean =>
    entry.hooks.some((hook) => hook.command.endsWith("hook codex core"));
  expect(pre.some((entry) => entry.matcher === "apply_patch" && harnessCore(entry))).toBe(true);
  expect(post.some((entry) => entry.matcher === "apply_patch" && harnessCore(entry))).toBe(false);
});
