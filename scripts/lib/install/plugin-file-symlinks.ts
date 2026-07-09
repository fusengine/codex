import { lstat, mkdir, readlink, symlink, unlink } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";

function isManagedPluginTarget(target: string): boolean {
	return target.includes("/plugins/") || target.includes("\\plugins\\");
}

async function clearManagedDestination(
	path: string,
	label: string,
	quiet: boolean,
): Promise<"missing" | "removed" | "skip"> {
	try {
		const stat = await lstat(path);
		if (!stat.isSymbolicLink()) {
			if (!quiet) p.log.warn(`${label} destination exists and is not a managed symlink, skipped: ${path}`);
			return "skip";
		}
		const target = await readlink(path);
		if (!isManagedPluginTarget(target)) {
			if (!quiet) p.log.warn(`${label} destination symlink is not managed by plugins, skipped: ${path}`);
			return "skip";
		}
		await unlink(path);
		return "removed";
	} catch {
		return "missing";
	}
}

export async function symlinkPluginFiles(
	files: Array<{ plugin: string; file: string; src: string }>,
	destDir: string,
	label: string,
	opts: { quiet?: boolean } = {},
): Promise<void> {
	await mkdir(destDir, { recursive: true });
	let linked = 0;
	let replaced = 0;
	const seen = new Set<string>();
	for (const item of files) {
		if (seen.has(item.file)) {
			if (!opts.quiet) p.log.warn(`${label} filename collision skipped: ${item.file} from ${item.plugin}`);
			continue;
		}
		seen.add(item.file);
		const legacyLinkPath = join(destDir, `${item.plugin}-${item.file}`);
		if (await clearManagedDestination(legacyLinkPath, label, !!opts.quiet) === "removed") replaced++;
		const linkPath = join(destDir, item.file);
		const result = await clearManagedDestination(linkPath, label, !!opts.quiet);
		if (result === "skip") continue;
		if (result === "removed") replaced++;
		await symlink(item.src, linkPath);
		linked++;
	}
	if (!opts.quiet) {
		p.log.success(`Symlinked ${linked} ${label}(s) into ${destDir}${replaced > 0 ? ` (${replaced} replaced)` : ""}`);
	}
}
