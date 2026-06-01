/**
 * rollout-agents.ts — detect explore/research APEX activity in the CURRENT turn
 * from the rollout (ground truth). Fallback for require-apex-agents when the
 * PostToolUse state writes don't fire in code_mode (openai/codex#19385), so the
 * gate no longer false-blocks work that actually explored/researched.
 */
import { iterFunctionCalls } from "./rollout-evidence";

const RESEARCH_RE = /mcp__context7__|mcp__exa__|query[_-]docs|resolve[_-]library[_-]id|context7|exa|web[_-]?search|webfetch|research-expert/i;
const EXPLORE_BASH_RE = /^\s*(rg|grep|find|ls|fd|ast-grep|tree|cat|head|tail)\b/;

export function apexAgentsInTranscript(sessionId: string): { explore: boolean; research: boolean } {
  const out = { explore: false, research: false };
  for (const p of iterFunctionCalls(sessionId)) {
    const name = String((p as { name?: unknown }).name ?? "");
    const raw = (p as { arguments?: unknown }).arguments;
    const args = typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
    if (RESEARCH_RE.test(`${name} ${args}`)) out.research = true;
    if (name === "Glob" || name === "Grep" || name === "list_dir" || /explore-codebase/.test(args)) {
      out.explore = true;
    } else if (/exec_command|shell/.test(name)) {
      try {
        const a = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>);
        if (EXPLORE_BASH_RE.test(String(a?.cmd ?? a?.command ?? ""))) out.explore = true;
      } catch { /* skip malformed */ }
    }
    if (out.explore && out.research) break;
  }
  return out;
}
