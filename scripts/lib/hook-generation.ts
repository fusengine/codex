import { canonicalHarnessCommand } from "./harness-hook-policy";

/** Return the canonical Harness command for a generated hook route. */
export function generatedHookCommand(
	plugin: string,
	event: string,
	matcher: string,
): string | undefined {
	return canonicalHarnessCommand(plugin, event, matcher);
}
