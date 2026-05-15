/**
 * Centralised session-state manager.
 * Single source of truth for loading/saving per-session JSON state.
 */
import { join } from "node:path";
import { homedir } from "node:os";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
	chmodSync,
	renameSync,
	unlinkSync,
} from "node:fs";
import { randomBytes } from "node:crypto";

/** Resolve the state directory lazily so HOME overrides are honoured. */
export function stateDir(): string {
	return join(homedir(), ".codex", "fusengine-cache", "sessions");
}

const SID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export function sanitizeSessionId(sid: unknown): string {
	const s = String(sid ?? "").trim();
	if (!SID_RE.test(s)) throw new Error(`Invalid session id: ${JSON.stringify(s)}`);
	return s;
}

export function ensureStateDir(): void {
	mkdirSync(stateDir(), { recursive: true, mode: 0o700 });
}

export function getStatePath(sid: string): string {
	return join(stateDir(), `session-${sanitizeSessionId(sid)}.json`);
}

export function loadSessionState(sid: string): Record<string, unknown> {
	const path = getStatePath(sid);
	if (!existsSync(path)) return {};
	try {
		const data = JSON.parse(readFileSync(path, "utf-8"));
		return data && typeof data === "object" && !Array.isArray(data) ? data : {};
	} catch {
		return {};
	}
}

export function saveSessionState(sid: string, state: Record<string, unknown>): void {
	if (!state || typeof state !== "object" || Array.isArray(state)) {
		throw new TypeError("state must be a dict");
	}
	ensureStateDir();
	const target = getStatePath(sid);
	const tmp = join(stateDir(), `.state_${randomBytes(8).toString("hex")}.tmp`);
	try {
		writeFileSync(tmp, JSON.stringify(state, null, 2), { encoding: "utf-8", mode: 0o600 });
		chmodSync(tmp, 0o600);
		renameSync(tmp, target);
	} catch (e) {
		try { unlinkSync(tmp); } catch { /* ignore */ }
		throw e;
	}
}
