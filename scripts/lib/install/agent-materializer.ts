import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import * as p from "@clack/prompts";
import type { PluginFile } from "./plugin-file.types";
import { buildPluginRoots } from "./plugin-root-resolver";
import { clearManagedDestination } from "./plugin-managed-destination";
import { MANAGED_AGENT_MARKER } from "./agent-install.constants";

const PORTABLE_SKILL_PATH_RE = /^plugins\/([^/]+)\/skills\/(.+)$/;
const CACHE_SKILL_PATH_RE = /\/\.codex\/plugins\/cache\/fusengine-codex\/([^/]+)\/[^/]+\/skills\/(.+)$/;

function tomlString(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function resolveSkillPath(value: string, item: PluginFile, pluginRoots: Map<string, string>): string {
	const portableMatch = PORTABLE_SKILL_PATH_RE.exec(value);
	if (portableMatch) {
		const [, plugin, skillPath] = portableMatch;
		const pluginRoot = pluginRoots.get(plugin);
		return pluginRoot ? join(pluginRoot, "skills", skillPath) : value;
	}
	const cacheMatch = CACHE_SKILL_PATH_RE.exec(value);
	if (cacheMatch) {
		const [, plugin, skillPath] = cacheMatch;
		const pluginRoot = pluginRoots.get(plugin);
		return pluginRoot ? join(pluginRoot, "skills", skillPath) : value;
	}
	if (value.startsWith("./") || value.startsWith("../")) return resolve(dirname(item.src), value);
	return value;
}

export function materializeAgentToml(raw: string, item: PluginFile, pluginRoots: Map<string, string>): string {
	const rewritten = raw.replace(/^(\s*path\s*=\s*)"([^"]+)"/gm, (_match, prefix: string, value: string) => {
		return `${prefix}${tomlString(resolveSkillPath(value, item, pluginRoots))}`;
	});
	return rewritten.startsWith(MANAGED_AGENT_MARKER) ? rewritten : `${MANAGED_AGENT_MARKER} ${item.src}\n${rewritten}`;
}

export async function materializeAgentFiles(files: PluginFile[], pluginsRoot: string, destDir: string): Promise<void> {
	await mkdir(destDir, { recursive: true });
	const pluginRoots = await buildPluginRoots(pluginsRoot);
	let installed = 0;
	let replaced = 0;
	const seen = new Set<string>();
	for (const item of files) {
		if (seen.has(item.file)) {
			p.log.warn(`agent filename collision skipped: ${item.file} from ${item.plugin}`);
			continue;
		}
		seen.add(item.file);
		const legacyPath = join(destDir, `${item.plugin}-${item.file}`);
		if (await clearManagedDestination(legacyPath, "agent") === "removed") replaced++;
		const destPath = join(destDir, item.file);
		const result = await clearManagedDestination(destPath, "agent");
		if (result === "skip") continue;
		if (result === "removed") replaced++;
		const raw = await readFile(item.src, "utf8");
		await writeFile(destPath, materializeAgentToml(raw, item, pluginRoots));
		installed++;
	}
	p.log.success(`Installed ${installed} agent(s) into ${destDir}${replaced > 0 ? ` (${replaced} replaced)` : ""}`);
}
