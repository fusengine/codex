/**
 * agents-resync.ts — logique de resync SessionStart : décide si l'empreinte du
 * cache d'agents a changé depuis la dernière fois, sans effet de bord tant que
 * ce n'est pas le cas. Extrait du hook (`resync-agents.native.ts`) qui, lui,
 * a un effet de bord top-level et n'est donc pas unit-testable — convention
 * déjà en vigueur pour les autres hooks session-start de ce repo.
 */
import {
	existsSync, readdirSync, lstatSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync,
} from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { join } from "node:path";
import { buildPluginRoots } from "./plugin-root-resolver";

/** Nom de marketplace figé — même valeur que scripts/install-codex.ts (dette de duplication préexistante). */
export const MARKETPLACE = "fusengine-codex";

export function pluginsCacheRoot(codexHome: string): string {
	return join(codexHome, "plugins", "cache", MARKETPLACE);
}

function manifestPath(codexHome: string): string {
	return join(codexHome, "fusengine", "state", "agents-cache-fingerprint.json");
}

/** sha256 sur les paires "plugin=root" triées — stable tant que la résolution du cache ne change pas. */
export function fingerprint(roots: Map<string, string>): string {
	const sorted = [...roots.entries()].sort(([a], [b]) => a.localeCompare(b));
	const hash = createHash("sha256");
	for (const [plugin, root] of sorted) hash.update(`${plugin}=${root}\n`);
	return hash.digest("hex");
}

export function readFingerprint(codexHome: string): string | undefined {
	try {
		const data = JSON.parse(readFileSync(manifestPath(codexHome), "utf8")) as { fingerprint?: string };
		return data.fingerprint;
	} catch {
		return undefined;
	}
}

/** Écriture atomique tmp+rename — reprend la recette de _shared/state-manager.ts::saveSessionState. */
export function writeFingerprint(codexHome: string, value: string): void {
	const dir = join(codexHome, "fusengine", "state");
	mkdirSync(dir, { recursive: true });
	const tmp = join(dir, `.agents-cache-fingerprint_${randomBytes(8).toString("hex")}.tmp`);
	writeFileSync(tmp, JSON.stringify({ fingerprint: value }), "utf8");
	try {
		renameSync(tmp, manifestPath(codexHome));
	} catch (e) {
		try { unlinkSync(tmp); } catch { /* ignore */ }
		throw e;
	}
}

/** True si un symlink direct de dir est cassé (cible disparue). */
export function hasDanglingSymlink(dir: string): boolean {
	if (!existsSync(dir)) return false;
	try {
		for (const name of readdirSync(dir)) {
			const full = join(dir, name);
			if (lstatSync(full).isSymbolicLink() && !existsSync(full)) return true;
		}
	} catch { /* best-effort */ }
	return false;
}

/** Résout les roots courants + empreinte ; undefined = rien en cache (fail-open). */
export async function resolveCurrentFingerprint(
	pluginsRoot: string,
): Promise<{ roots: Map<string, string>; value: string } | undefined> {
	if (!existsSync(pluginsRoot)) return undefined;
	const roots = await buildPluginRoots(pluginsRoot);
	if (roots.size === 0) return undefined;
	return { roots, value: fingerprint(roots) };
}

/** True si une resync est nécessaire : empreinte différente, jamais enregistrée, ou symlink de commande cassé. */
export function needsResync(codexHome: string, currentValue: string, promptsDir: string): boolean {
	return currentValue !== readFingerprint(codexHome) || hasDanglingSymlink(promptsDir);
}
