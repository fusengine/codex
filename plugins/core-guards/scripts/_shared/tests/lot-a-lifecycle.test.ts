import { afterEach, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanupRoots, runHook, tempRoot } from "./hook-process";

const core = join(import.meta.dir, "..", "..");
const teammate = join(core, "teammate-idle", "validate-teammate-output.native.ts");
const task = join(core, "task-completed", "validate-task-solid.native.ts");

afterEach(cleanupRoots);

for (const [name, script] of [["SubagentStop", teammate], ["Stop", task]] as const) {
  test.each(["{", "null", "[]", "42", '"scalar"'])(`${name} ignores %s`, async (stdin) => {
    const root = tempRoot("core-invalid-");
    const result = await runHook(script, stdin, { cwd: root, codexHome: join(root, ".codex") });
    expect(result).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });
}

test("SubagentStop emits only systemMessage using agent_type", async () => {
  const root = tempRoot("subagent-stop-");
  const codexHome = join(root, ".codex");
  const sessions = join(codexHome, "fusengine", "sessions");
  mkdirSync(sessions, { recursive: true });
  writeFileSync(join(sessions, "session-session-a-changes.json"), JSON.stringify({
    cumulativeCodeFiles: 2,
    modifiedFiles: ["src/a.ts", "src/b.ts"],
  }));
  const result = await runHook(teammate, JSON.stringify({
    session_id: "session-a",
    agent_type: "sniper",
  }), { cwd: root, codexHome });

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  const output = JSON.parse(result.stdout);
  expect(Object.keys(output)).toEqual(["systemMessage"]);
  expect(output.systemMessage).toContain("Agent 'sniper' stopped");
});

test("Stop emits only systemMessage", async () => {
  const root = tempRoot("stop-solid-");
  const codexHome = join(root, ".codex");
  const sessions = join(codexHome, "fusengine", "sessions");
  mkdirSync(sessions, { recursive: true });
  const codeFile = join(root, "oversized.ts");
  const lines = Array.from({ length: 101 }, (_, index) => `const n${index} = ${index};`);
  writeFileSync(codeFile, lines.join("\n"));
  writeFileSync(join(sessions, "session-session-b-changes.json"), JSON.stringify({
    modifiedFiles: [codeFile],
  }));
  const result = await runHook(task, JSON.stringify({ session_id: "session-b" }), {
    cwd: root,
    codexHome,
  });

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  const output = JSON.parse(result.stdout);
  expect(Object.keys(output)).toEqual(["systemMessage"]);
  expect(output.systemMessage).toContain("SOLID VIOLATION at Stop");
});
