#!/usr/bin/env bun
// @hook-entry
/**
 * pre-commit-guard.native.ts — native TS port of
 * _legacy_py/pre-tool-use/pre-commit-guard.py.
 *
 * PreToolUse: on a `git ... commit` command, run applicable linters (never
 * auto-fixing) and deny the commit with details on failure, else allow. Linter
 * selection, timeout and reason strings are verbatim from the Python for parity.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { emitPreTool } from "../_shared/hook-output";
import { normalizeCommand } from "../_shared/normalize-command";

const TIMEOUT_MS = 30_000;
const ESLINT_CONFIGS = [".eslintrc.json", ".eslintrc.js", "eslint.config.js", "eslint.config.mjs", "eslint.config.ts"];
const PRETTIER_CONFIGS = [".prettierrc", ".prettierrc.json", "prettier.config.js"];

interface ToolInput { command?: unknown; }

/** Run a linter; return [passed, formattedOutput] (mirrors run_linter). */
function runLinter(cmd: string[], label: string): [boolean, string] {
  const r = spawnSync(cmd[0]!, cmd.slice(1), { encoding: "utf-8", timeout: TIMEOUT_MS });
  if (r.error || r.signal) return [true, ""]; // timeout/OSError → pass (best-effort)
  if ((r.status ?? 0) !== 0) {
    const output = (r.stdout ?? "").trim() || (r.stderr ?? "").trim();
    return [false, output ? `[${label}]\n${output}` : ""];
  }
  return [true, ""];
}

/** Whether a binary is resolvable on PATH (mirrors shutil.which). */
function which(bin: string): boolean {
  const r = spawnSync("command", ["-v", bin], { encoding: "utf-8", shell: "/bin/sh" });
  return (r.status ?? 1) === 0 && Boolean((r.stdout ?? "").trim());
}

/** Run all applicable linters, return error strings (mirrors collect_errors). */
function collectErrors(): string[] {
  const errors: string[] = [];
  const hasBunx = which("bunx");
  if (existsSync("package.json") && hasBunx) {
    if (ESLINT_CONFIGS.some(existsSync)) {
      const [ok, msg] = runLinter(["bunx", "eslint", ".", "--max-warnings", "0"], "ESLint");
      if (!ok && msg) errors.push(msg);
    }
    if (existsSync("tsconfig.json")) {
      const [ok, msg] = runLinter(["bunx", "tsc", "--noEmit"], "TypeScript");
      if (!ok && msg) errors.push(msg);
    }
    if (PRETTIER_CONFIGS.some(existsSync)) {
      const [ok, msg] = runLinter(["bunx", "prettier", "--check", "."], "Prettier");
      if (!ok && msg) errors.push(msg);
    }
  }
  const hasPython = existsSync("requirements.txt") || existsSync("pyproject.toml");
  if (hasPython && which("ruff")) {
    const [ok, msg] = runLinter(["ruff", "check", "."], "Ruff");
    if (!ok && msg) errors.push(msg);
  }
  return errors;
}

let data: { tool_input?: ToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
const cmd = normalizeCommand(data.tool_input?.command);
if (!cmd.startsWith("git") || !cmd.includes("commit")) process.exit(0);

const errors = collectErrors();
if (errors.length) {
  emitPreTool("deny", `COMMIT BLOCKED — Fix then retry:\n\n${errors.join("\n\n")}`);
} else {
  emitPreTool("allow", "All linters passed", { context: "Pre-commit linter check: all passed" });
}
process.exit(0);
