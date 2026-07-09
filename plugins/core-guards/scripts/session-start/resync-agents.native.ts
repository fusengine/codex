#!/usr/bin/env bun
// @hook-entry
/**
 * resync-agents.native.ts — SessionStart : re-matérialise les TOML d'agents (et
 * répare les symlinks de commandes) depuis la version la PLUS RÉCENTE du cache
 * plugin. `setup` (installAgents/installCommands, runner.ts) ne tourne qu'une
 * fois ; un bump du cache marketplace entre deux sessions laissait sinon
 * ~/.codex/agents/*.toml figés sur un instantané de skills obsolète. Les agents
 * sont COPIÉS (TOML matérialisés), pas symlinkés comme les commandes, car Codex
 * ignore les TOML d'agents symlinkés (openai/codex#15345 « Support symlinks for
 * custom agent TOMLS », fermée le 2026-05-10 faute d'upvotes, jamais corrigée,
 * aucune PR associée) — le contournement par copies est donc permanent.
 *
 * 1. `matcher: ""` (hooks.json) : (a) SessionStart n'a pas de nom d'outil à
 *    filtrer — un matcher vide est la forme correcte, pas un raccourci ; (b)
 *    on veut tourner sur TOUTE source de session pour garder l'invariant de
 *    fraîcheur, peu importe comment la session a démarré ; (c) la sémantique
 *    Codex ne permet de toute façon aucun filtrage utile ici (contrairement à
 *    PreToolUse "Bash"/"apply_patch").
 * 2. Contrat stdout : SessionStart est lu comme JSON par Codex — tout texte
 *    non-JSON casserait le bootstrap. D'où : silencieux en toutes circonstances.
 * 3. L'ordre cache-marketplace/exécution-hook n'est PAS garanti atomique par
 *    Codex (un `codex plugin update` concurrent pourrait laisser un cache
 *    partiellement écrit) — non contrôlable ici ; le fail-open + l'auto-
 *    réparation via l'empreinte (session suivante) absorbent ce risque.
 * 4. Verrou best-effort (resync-lock.ts) : deux sessions Codex démarrant en
 *    même temps ne peuvent pas écrire des versions différentes du cache en
 *    interleave (TOML déchiré).
 * 5. Limite connue haute : un `codex` bare qui restaure la session précédente
 *    (soft-restart) peut ne PAS déclencher SessionStart du tout dans certains
 *    cas (cf. openai/codex#24228 — non-déclenchement sur restauration
 *    implicite) ; ce hook ne tourne alors pas, un bump de cache pendant cette
 *    fenêtre n'est repris qu'au prochain hard-start.
 * 6. Limite connue permanente : le verrou n'a pas de vérification de PID
 *    vivant (limite de fond de tout lock par mtime de fichier, acceptée aussi
 *    par `proper-lockfile`) — un process mort libère son verrou par TTL
 *    (30s), jamais par détection de mort ; compromis définitif, pas un bug.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { installAgents, installCommands } from "../../../../scripts/lib/install/install-agents";
import {
	needsResync, pluginsCacheRoot, resolveCurrentFingerprint, writeFingerprint,
} from "../../../../scripts/lib/install/agents-resync";
import { acquireResyncLock, releaseResyncLock } from "../../../../scripts/lib/install/resync-lock";

/** Largement sous le timeout déclaré (15s) dans hooks.json. */
const HARD_TIMEOUT_MS = 2500;
const codexHome = process.env.CODEX_HOME ?? join(homedir(), ".codex");

async function main(): Promise<void> {
	const pluginsRoot = pluginsCacheRoot(codexHome);
	const resolved = await resolveCurrentFingerprint(pluginsRoot);
	if (!resolved) return; // rien en cache — le setup initial gère ce cas, pas ce hook
	const promptsDir = join(codexHome, "prompts");
	if (!needsResync(codexHome, resolved.value, promptsDir)) return; // fast path
	if (!acquireResyncLock(codexHome)) return; // une autre session s'en charge
	try {
		await installAgents(codexHome, pluginsRoot, { quiet: true });
		await installCommands(codexHome, pluginsRoot, { quiet: true });
		writeFingerprint(codexHome, resolved.value); // en DERNIER : crash avant → resync à la prochaine session
	} finally {
		releaseResyncLock(codexHome);
	}
}

const timer = setTimeout(() => process.exit(0), HARD_TIMEOUT_MS);
main()
	.catch(() => { /* fail-open : un snapshot périmé est récupérable, un SessionStart bloqué ne l'est pas */ })
	.finally(() => { clearTimeout(timer); process.exit(0); });
