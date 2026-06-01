#!/usr/bin/env bun
// @hook-entry
/**
 * enforce-file-size.native.ts — native TS port of
 * _legacy_py/pre-tool-use/enforce-file-size.py.
 *
 * PreToolUse: deny writes that push a code file past 100 lines (Write/Edit
 * file_path or apply_patch V4A). solid_ref routing, projected line counts and
 * reason strings are verbatim from the Python for strict parity.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { emitPreTool } from "../_shared/hook-output";

const CODE_EXT = /\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|dart|vue|svelte|astro)$/;
const MAX = 100;

interface ToolInput { command?: string; input?: string; patch?: string; file_path?: string; content?: string; new_string?: string; }

/** Routed SOLID skill ref for a path (mirrors solid_ref). */
function solidRef(fp: string): string {
  const ext = fp.includes(".") ? fp.slice(fp.lastIndexOf(".") + 1) : "";
  if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    const d = dirname(fp);
    const nx = ["next.config.js", "next.config.ts"].some((c) => existsSync(join(d, c)));
    return nx ? "nextjs-expert/skills/solid-nextjs/" : "react-expert/skills/solid-react/";
  }
  return { php: "laravel-expert/skills/solid-php/", swift: "swift-apple-expert/skills/solid-swift/" }[ext] ?? "generic/";
}

/** Yield [action, path, addedLines] from a V4A apply_patch body. */
function* parseV4a(body: string): Generator<[string, string, number]> {
  let p: string | null = null, a: string | null = null, n = 0;
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$/);
    if (h) {
      if (p) yield [a!, p, n];
      a = h[1]!.toLowerCase(); p = h[2]!.trim(); n = 0;
    } else if ((a === "add" || a === "update") && line.startsWith("+") && !line.startsWith("+++")) {
      n += 1;
    }
  }
  if (p) yield [a!, p, n];
}

/** Build a deny reason, or null when within budget. */
function deny(path: string, proj: number): string | null {
  if (!path || !CODE_EXT.test(path) || proj <= MAX) return null;
  return `BLOCKED: '${basename(path)}' would be ${proj} lines (max ${MAX}). `
    + `Read SOLID at ~/.codex/plugins/cache/fusengine-codex/${solidRef(path)} `
    + "and split into modules <90 lines.";
}

/** Count file lines (0 if absent), mirroring sum(1 for _ in open). */
function fileLines(path: string): number {
  if (!existsSync(path)) return 0;
  const t = readFileSync(path, "utf-8");
  if (t === "") return 0;
  return t.split("\n").length - (t.endsWith("\n") ? 1 : 0);
}

/** Projected line count after an apply_patch action. */
function projected(action: string, path: string, adds: number): number {
  if (action === "add") return adds;
  return fileLines(path) + adds;
}

let data: { agent_type?: string; tool_name?: string; tool_input?: ToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
if (data.agent_type === "Explore" || data.agent_type === "Plan") process.exit(0);

const tool = data.tool_name ?? "";
const ti = data.tool_input ?? {};
const reasons: string[] = [];
if (tool === "apply_patch") {
  const body = ti.command || ti.input || ti.patch || "";
  for (const [action, path, adds] of parseV4a(body)) {
    if (action === "delete") continue;
    const r = deny(path, projected(action, path, adds));
    if (r) reasons.push(r);
  }
} else {
  const fp = ti.file_path ?? "";
  const content = ti.new_string || ti.content || "";
  const proj = tool === "Write" && content ? (content.split("\n").length - 1) + 1 : fileLines(fp);
  const r = deny(fp, proj);
  if (r) reasons.push(r);
}
if (reasons.length) emitPreTool("deny", reasons.join(" | "), { scriptName: "enforce-file-size" });
process.exit(0);
