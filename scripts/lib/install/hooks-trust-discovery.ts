/**
 * hooks-trust-discovery.ts — enumerates installed plugins' cached `hooks/hooks.json` under
 * `${codexHome}/plugins/cache/${marketplaceName}/` and computes each command handler's
 * persisted trust key + hash (pure hashing lives in hook-hash.ts).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { computeCommandHookHash, hookKey, pluginHookKeySource } from "./hook-hash";
import type { HooksJsonFile, HooksJsonMatcherGroup } from "./hook-hash.types";
import type { TrustableHookEntry } from "./hooks-trust.types";

const HOOKS_RELATIVE_PATH = "hooks/hooks.json";

/** Highest (lexicographically last) version directory under one cached plugin. */
async function latestVersion(pluginDir: string): Promise<string | undefined> {
	const entries = await readdir(pluginDir, { withFileTypes: true }).catch(() => []);
	return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort().at(-1);
}

async function readHooksJson(path: string): Promise<HooksJsonFile | undefined> {
	const file = Bun.file(path);
	if (!(await file.exists())) return undefined;
	return (await file.json()) as HooksJsonFile;
}

function entriesForEvent(
	eventName: string,
	groups: HooksJsonMatcherGroup[],
	keySource: string,
	pluginId: string,
): TrustableHookEntry[] {
	const entries: TrustableHookEntry[] = [];
	groups.forEach((group, groupIndex) => {
		group.hooks.forEach((handler, handlerIndex) => {
			if (handler.type !== "command" || !handler.command) return;
			const hash = computeCommandHookHash({
				eventName,
				matcher: group.matcher,
				command: handler.command,
				timeoutSec: handler.timeout,
				async: handler.async,
				statusMessage: handler.statusMessage,
				additionalContextLimit: handler.additionalContextLimit,
			});
			entries.push({
				key: hookKey(keySource, eventName, groupIndex, handlerIndex),
				hash,
				pluginId,
				eventName,
				command: handler.command,
			});
		});
	});
	return entries;
}

/** Enumerates every command-hook handler declared by installed plugins' cached hooks.json. */
export async function discoverTrustableHooks(codexHome: string, marketplaceName: string): Promise<TrustableHookEntry[]> {
	const cacheRoot = join(codexHome, "plugins", "cache", marketplaceName);
	const pluginDirs = await readdir(cacheRoot, { withFileTypes: true }).catch(() => []);
	const entries: TrustableHookEntry[] = [];
	for (const pluginDir of pluginDirs) {
		if (!pluginDir.isDirectory()) continue;
		const version = await latestVersion(join(cacheRoot, pluginDir.name));
		if (!version) continue;
		const hooksFile = await readHooksJson(join(cacheRoot, pluginDir.name, version, HOOKS_RELATIVE_PATH));
		if (!hooksFile?.hooks) continue;
		const pluginId = `${pluginDir.name}@${marketplaceName}`;
		const keySource = pluginHookKeySource(pluginId, HOOKS_RELATIVE_PATH);
		for (const [eventName, groups] of Object.entries(hooksFile.hooks)) {
			entries.push(...entriesForEvent(eventName, groups, keySource, pluginId));
		}
	}
	return entries;
}
