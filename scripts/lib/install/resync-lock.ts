/**
 * resync-lock.ts — verrou inter-process best-effort pour agents-resync.ts.
 * `writeFileSync(path, pid, { flag: "wx" })` échoue avec EEXIST si le fichier
 * existe déjà (O_EXCL) : deux sessions Codex démarrant en même temps ne
 * peuvent donc pas résoudre puis écrire des versions DIFFÉRENTES du cache
 * d'agents en interleave (TOML déchiré). Stale après 30s pour survivre au
 * crash d'une session qui n'a jamais atteint son `finally`. Pas de vérif PID
 * vivant (limite connue et permanente, cf. `proper-lockfile`) — le seuil
 * reste volontairement conservateur.
 */
import { mkdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const STALE_MS = 30_000;

function lockPath(codexHome: string): string {
	return join(codexHome, "fusengine", "state", "agents-resync.lock");
}

/** Acquiert le verrou ; false si un autre process le tient déjà (non périmé). */
export function acquireResyncLock(codexHome: string): boolean {
	const path = lockPath(codexHome);
	mkdirSync(dirname(path), { recursive: true });
	try {
		writeFileSync(path, String(process.pid), { flag: "wx" });
		return true;
	} catch {
		try {
			if (Date.now() - statSync(path).mtimeMs <= STALE_MS) return false;
			unlinkSync(path);
			writeFileSync(path, String(process.pid), { flag: "wx" });
			return true;
		} catch {
			return false;
		}
	}
}

/** Libère le verrou ; best-effort, ne jamais lever. */
export function releaseResyncLock(codexHome: string): void {
	try {
		unlinkSync(lockPath(codexHome));
	} catch { /* best-effort */ }
}
