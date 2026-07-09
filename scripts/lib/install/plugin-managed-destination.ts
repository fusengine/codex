import { lstat, readFile, readlink, unlink } from "node:fs/promises";
import * as p from "@clack/prompts";
import { MANAGED_AGENT_MARKER } from "./agent-install.constants";

function isManagedPluginTarget(target: string): boolean {
	return target.includes("/plugins/") || target.includes("\\plugins\\");
}

export async function clearManagedDestination(
	path: string,
	label: string,
	opts: { quiet?: boolean } = {},
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
		if ((await readFile(path, "utf8")).startsWith(MANAGED_AGENT_MARKER)) {
			await unlink(path);
			return "removed";
		}
		if (!opts.quiet) p.log.warn(`${label} destination exists and is not managed by plugins, skipped: ${path}`);
		return "skip";
	} catch {
		return "missing";
	}
}
