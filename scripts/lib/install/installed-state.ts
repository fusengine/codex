/**
 * installed-state.ts - Inspect Fusengine plugin installation state without
 * mutating the user's Codex home.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
	cacheVersions,
	countHooks,
	enabledPlugins,
	sourcePluginNames,
	sourceVersion,
} from "./installed-state-helpers";
import {
	type InstalledPluginState,
	type InstallStatus,
	statusFor,
} from "./installed-state-model";

export type { InstalledPluginState, InstallStatus } from "./installed-state-model";

export function inspectInstalledState(
	projectRoot: string,
	codexHome: string,
	marketplaceName: string,
): InstalledPluginState[] {
	const enabled = enabledPlugins(codexHome);
	return sourcePluginNames(projectRoot).map((name) => {
		const version = sourceVersion(projectRoot, name);
		const versions = cacheVersions(codexHome, marketplaceName, name);
		const cacheVersion = versions.includes(version) ? version : versions.at(-1);
		const cacheRoot = cacheVersion
			? join(codexHome, "plugins", "cache", marketplaceName, name, cacheVersion)
			: "";
		const cacheExists = cacheVersion !== undefined && existsSync(cacheRoot);
		const pluginEnabled = enabled.has(`${name}@${marketplaceName}`);
		const status = statusFor({
			sourceVersion: version,
			cacheVersion,
			enabled: pluginEnabled,
			cacheExists,
		});
		return {
			name,
			sourceVersion: version,
			cacheVersions: versions,
			cacheVersion,
			enabled: pluginEnabled,
			cacheExists,
			hooksCount: cacheExists ? countHooks(cacheRoot) : countHooks(join(projectRoot, "plugins", name)),
			status: status.status,
			reasons: status.reasons,
		};
	});
}

export function summarizeInstalledState(states: InstalledPluginState[]): Record<InstallStatus, number> {
	return states.reduce<Record<InstallStatus, number>>((summary, state) => {
		summary[state.status]++;
		return summary;
	}, { current: 0, missing: 0, stale: 0, broken: 0 });
}

export function assertInstalledState(
	projectRoot: string,
	codexHome: string,
	marketplaceName: string,
): InstalledPluginState[] {
	const states = inspectInstalledState(projectRoot, codexHome, marketplaceName);
	const broken = states.filter((state) => state.status !== "current");
	if (broken.length === 0) return states;

	const details = broken
		.map((state) => `${state.name}: ${state.status} (${state.reasons.join("; ")})`)
		.join("\n");
	throw new Error(`Fusengine plugin installation incomplete:\n${details}`);
}
