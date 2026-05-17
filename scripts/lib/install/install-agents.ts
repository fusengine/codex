/**
 * install-agents.ts — Symlink plugin agents into ~/.codex/agents/.
 * Codex CLI 0.130.x ne charge pas agents bundlés (issue openai/codex#18988).
 * Doc: developers.openai.com/codex/subagents — custom agents = TOML standalone
 * sous ~/.codex/agents/ (perso) ou .codex/agents/ (projet).
 */
import { mkdir, readdir, symlink, unlink, lstat } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";

async function exists(path: string): Promise<boolean> {
	try { await lstat(path); return true; } catch { return false; }
}

async function listAgents(pluginsRoot: string): Promise<Array<{ plugin: string; file: string; src: string }>> {
	const out: Array<{ plugin: string; file: string; src: string }> = [];
	for (const e of await readdir(pluginsRoot, { withFileTypes: true })) {
		if (!e.isDirectory() || e.name.startsWith(".") || e.name === "_shared") continue;
		const agentsDir = join(pluginsRoot, e.name, "agents");
		if (!(await exists(agentsDir))) continue;
		for (const f of await readdir(agentsDir)) {
			if (f.endsWith(".toml")) out.push({ plugin: e.name, file: f, src: join(agentsDir, f) });
		}
	}
	return out;
}

export async function installAgents(codexHome: string, pluginsRoot: string): Promise<void> {
	const destDir = join(codexHome, "agents");
	await mkdir(destDir, { recursive: true });
	const agents = await listAgents(pluginsRoot);
	let linked = 0;
	let replaced = 0;
	for (const a of agents) {
		const linkPath = join(destDir, `${a.plugin}-${a.file}`);
		if (await exists(linkPath)) { await unlink(linkPath); replaced++; }
		await symlink(a.src, linkPath);
		linked++;
	}
	p.log.success(`Symlinked ${linked} agent(s) into ${destDir}${replaced > 0 ? ` (${replaced} replaced)` : ""}`);
}
