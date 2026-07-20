import { lstat, readFile, readlink, unlink } from "node:fs/promises";
import * as p from "@clack/prompts";
import { MANAGED_AGENT_MARKER } from "./agent-install.constants";

function isManagedPluginTarget(target: string): boolean {
	return target.includes("/plugins/") || target.includes("\\plugins\\");
}

/**
 * Clears `path` if it is safe to overwrite: a symlink into a managed plugin root, or a
 * regular file starting with `marker`. Leaves foreign files/symlinks untouched (warns,
 * returns "skip") so a hand-edited or third-party destination is never clobbered.
 *
 * `marker` defaults to {@link MANAGED_AGENT_MARKER} to keep every existing call site
 * (agent/command materialization) unchanged; callers with their own generated-content
 * marker (e.g. exec-policy rules) pass it explicitly instead of duplicating this guard.
 */
export async function clearManagedDestination(
	path: string,
	label: string,
	opts: { quiet?: boolean } = {},
	marker: string = MANAGED_AGENT_MARKER,
): Promise<"missing" | "removed" | "skip"> {
	try {
		const stat = await lstat(path);
		if (stat.isSymbolicLink()) {
			const target = await readlink(path);
			if (!isManagedPluginTarget(target)) {
				if (!opts.quiet) p.log.warn(`${label} destination symlink is not managed by plugins, skipped: ${path}`);
				return "skip";
			}
			await unlink(path);
			return "removed";
		}
		if ((await readFile(path, "utf8")).startsWith(marker)) {
			await unlink(path);
			return "removed";
		}
		if (!opts.quiet) p.log.warn(`${label} destination exists and is not managed by plugins, skipped: ${path}`);
		return "skip";
	} catch {
		return "missing";
	}
}
