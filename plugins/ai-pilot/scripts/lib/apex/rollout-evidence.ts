/**
 * rollout-evidence.ts - Read APEX doc-consultation evidence from the rollout tree.
 *
 * Per-tool PostToolUse hooks are not reliably emitted in code_mode
 * (openai/codex#19385), and APEX research runs in spawned subagents whose MCP
 * calls land in child rollouts. So the gate scans the whole session rollout
 * tree (main + children) for Context7 + Exa usage. Consultation always precedes
 * the apply_patch, so the evidence is already flushed.
 */
import { sessionRollouts, readTail } from "./rollout-locate";

const CONTEXT7_RE = /query[_-]docs|resolve[_-]library[_-]id|context7/i;
const EXA_RE = /exa/i;

type DocEvidence = { context7: boolean; exa: boolean };

/** True when both Context7 and Exa were used within ttlMs (per the rollout tree). */
export function docConsultedInTranscript(sessionId: string, ttlMs = 180_000): boolean {
  const ev = readDocEvidence(sessionId, ttlMs);
  return ev.context7 && ev.exa;
}

/**
 * Scan the session rollout tree for Context7 + Exa function_calls within the TTL.
 * Matches bare names (query_docs), separate namespace (mcp__context7__) and
 * code_mode calls embedded in exec_command arguments (tools.mcp__exa__...).
 */
export function readDocEvidence(sessionId: string, ttlMs = 180_000): DocEvidence {
  const out: DocEvidence = { context7: false, exa: false };
  const cutoff = Date.now() - ttlMs;
  for (const path of sessionRollouts(sessionId)) {
    for (const line of readTail(path).split("\n")) {
      if (!line.includes("function_call")) continue;
      try {
        const entry = JSON.parse(line);
        const p = entry?.payload ?? entry?.item ?? entry;
        if (p?.type !== "function_call" && entry?.type !== "function_call") continue;
        const ts = Date.parse(entry?.timestamp ?? "");
        if (!Number.isNaN(ts) && ts < cutoff) continue;
        const id = `${p.name ?? ""} ${p.namespace ?? ""} ${typeof p.arguments === "string" ? p.arguments : ""}`;
        if (CONTEXT7_RE.test(id)) out.context7 = true;
        if (EXA_RE.test(id)) out.exa = true;
        if (out.context7 && out.exa) return out;
      } catch { /* skip malformed */ }
    }
  }
  return out;
}
