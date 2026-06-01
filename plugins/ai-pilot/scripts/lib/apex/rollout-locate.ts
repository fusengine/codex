/**
 * rollout-locate.ts - Locate the Codex session's rollout JSONLs (main + children).
 *
 * Codex runs APEX research in spawned subagents, whose MCP calls land in CHILD
 * rollout files (own thread UUID) that record the parent via parent_thread_id /
 * the shared session_id (openai/codex#20437). A gate must therefore scan the
 * main rollout AND its children, not just the file named after session_id.
 * Per-tool PostToolUse is unreliable in code_mode (openai/codex#19385), so the
 * rollout tree is the ground truth.
 */
import { readdirSync, statSync, openSync, readSync, closeSync } from "node:fs";

const CODEX_HOME = process.env.CODEX_HOME ?? `${process.env.HOME}/.codex`;
const MAX_TAIL_BYTES = 8 * 1024 * 1024;  // memory backstop; real scoping is turn-anchoring below
const MAX_AGE_MS = 3_600_000;
const HEAD_BYTES = 4096;
// Current-turn anchors: match compact (Codex/Rust) and spaced (Python) JSON.
const USER_TURN_MARKERS = ['"type": "user_message"', '"type":"user_message"'];
const TASK_START_MARKERS = ['"type": "task_started"', '"type":"task_started"'];

/** Recursively collect recent *.jsonl rollout paths (bounded by mtime). */
function recentRollouts(dir: string, depth: number, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const path = `${dir}/${e}`;
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (depth > 0) recentRollouts(path, depth - 1, out);
    } else if (e.endsWith(".jsonl") && Date.now() - st.mtimeMs <= MAX_AGE_MS) {
      out.push(path);
    }
  }
}

/** Read the first HEAD_BYTES of a file (session_meta lives on line 1). */
function readChunk(path: string, fromEnd: boolean): string {
  let fd = -1;
  try {
    fd = openSync(path, "r");
    const size = statSync(path).size;
    const length = Math.min(fromEnd ? MAX_TAIL_BYTES : HEAD_BYTES, size);
    const start = fromEnd ? size - length : 0;
    const buf = Buffer.alloc(length);
    readSync(fd, buf, 0, length, start);
    return buf.toString("utf-8");
  } catch {
    return "";
  } finally {
    if (fd >= 0) try { closeSync(fd); } catch { /* noop */ }
  }
}

/** Slice `text` from the current task turn: the last user_message line, else
 * the last task_started (subagent child rollouts have no user_message), else
 * the whole tail. Scoping by turn — not a fixed byte window — stops a noisy
 * command from evicting the turn's evidence. */
function sliceFromTurnAnchor(text: string): string {
  for (const markers of [USER_TURN_MARKERS, TASK_START_MARKERS]) {
    const at = Math.max(...markers.map((m) => text.lastIndexOf(m)));
    if (at >= 0) {
      const lineStart = text.lastIndexOf("\n", at);
      return text.slice(lineStart >= 0 ? lineStart + 1 : 0);
    }
  }
  return text;
}

/** Read the MAX_TAIL_BYTES tail, sliced to the current task turn. */
export function readTail(path: string): string {
  return sliceFromTurnAnchor(readChunk(path, true));
}

/**
 * Return the session's rollout files: the one named after session_id plus any
 * child rollout whose session_meta references session_id (parent linkage).
 */
export function sessionRollouts(sessionId: string): string[] {
  if (!sessionId) return [];
  const all: string[] = [];
  recentRollouts(`${CODEX_HOME}/sessions`, 4, all);
  const out: string[] = [];
  for (const path of all) {
    const name = path.slice(path.lastIndexOf("/") + 1);
    if (name.includes(sessionId) || readChunk(path, false).includes(sessionId)) {
      out.push(path);
    }
  }
  return out;
}
