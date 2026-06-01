/**
 * neural.ts — shared helpers for the memory-neural native hooks.
 *
 * Centralises the bits the Python hooks duplicated: the Graphiti base URL
 * (NEURAL_MEMORY_HOST/GRAPHITI_PORT), the UTC ISO-Z timestamp format, the
 * CODEX_HOME log dir, the best-effort POST (5s timeout, failures ignored) and
 * the shared salience weighting. Behaviour is verbatim with the Python.
 */
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HOST = process.env.NEURAL_MEMORY_HOST ?? "localhost";
const PORT = process.env.GRAPHITI_PORT ?? "8000";

/** Graphiti endpoint URL for a path (e.g. "/episodes", "/search"). */
export function graphitiUrl(path: string): string {
  return `http://${HOST}:${PORT}${path}`;
}

/** Current UTC time as "YYYY-MM-DDTHH:MM:SSZ" (strftime parity). */
export function utcTs(): string {
  return `${new Date().toISOString().slice(0, 19)}Z`;
}

/** Ensure and return ~/.codex/logs/00-memory (CODEX_HOME aware). */
export function memoryLogDir(): string {
  const codex = process.env.CODEX_HOME ?? join(homedir(), ".codex");
  const dir = join(codex, "logs", "00-memory");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Best-effort JSON POST to Graphiti; swallows all errors like the Python. */
export async function postGraphiti(path: string, body: unknown): Promise<void> {
  try {
    await fetch(graphitiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    /* offline / unreachable — ignored, parity with URLError pass */
  }
}

/** Salience = 0.40*sev/10 + 0.30 + 0.10 + 0.05 (verbatim weights). */
export function salience(severity: number): number {
  return 0.40 * severity / 10 + 0.30 * 1.0 + 0.20 * 0.5 + 0.10 * 0.5;
}
