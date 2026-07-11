import { mkdtempSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HookResult, HookRunOptions } from "./hook-process.types";

export const roots: string[] = [];

export function tempRoot(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  roots.push(root);
  return root;
}

export async function cleanupRoots(): Promise<void> {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
}

export async function runHook(
  script: string,
  stdin: string,
  options: HookRunOptions = {},
): Promise<HookResult> {
  const proc = Bun.spawn(["bun", script], {
    cwd: options.cwd,
    env: { ...process.env, ...(options.codexHome ? { CODEX_HOME: options.codexHome } : {}) },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  proc.stdin.write(stdin);
  proc.stdin.end();
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { exitCode, stdout, stderr };
}
