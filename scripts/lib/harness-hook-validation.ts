import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { canonicalHarnessCommand, HARNESS_VERSION } from "./harness-hook-policy";
import type { HookHandlerTuple, WiringValidationOptions } from "./harness-hook.types";

const tupleKey = ({ plugin, event, matcher, command }: HookHandlerTuple): string =>
	JSON.stringify([plugin, event, matcher, command]);

function installedVersion(root: string): string {
	const file = join(root, "node_modules", "@fusengine", "harness", "package.json");
	return JSON.parse(readFileSync(file, "utf8")).version;
}

function handlers(root: string): HookHandlerTuple[] {
	const result: HookHandlerTuple[] = [];
	for (const plugin of readdirSync(join(root, "plugins")).sort()) {
		const file = join(root, "plugins", plugin, "hooks", "hooks.json");
		if (!existsSync(file)) continue;
		const config = JSON.parse(readFileSync(file, "utf8"));
		for (const [event, groups] of Object.entries(config.hooks ?? {}) as [string, any[]][]) {
			for (const group of groups) for (const hook of group.hooks ?? []) {
				result.push({ plugin, event, matcher: group.matcher ?? "", command: hook.command ?? "" });
			}
		}
	}
	return result;
}

/** Validate that every live handler uses its exact Harness route. */
export function validateHarnessHookWiring(root: string, options: WiringValidationOptions = {}): string[] {
	const errors: string[] = [];
	const version = options.installedHarnessVersion ?? installedVersion(root);
	if (version !== HARNESS_VERSION) errors.push(`Harness ${version} installed; re-audit for ${HARNESS_VERSION}`);

	const seen = new Set<string>();
	for (const handler of handlers(root)) {
		const key = tupleKey(handler);
		if (seen.has(key)) errors.push(`duplicate handler: ${key}`);
		seen.add(key);
		const canonical = canonicalHarnessCommand(handler.plugin, handler.event, handler.matcher);
		if (handler.command === canonical) continue;
		if (!canonical) errors.push(`${key}: no Harness route`);
		else errors.push(`${key}: non-canonical command; expected ${canonical}`);
	}
	return errors;
}
