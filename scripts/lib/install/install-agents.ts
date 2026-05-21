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

function compareVersionsDesc(a: string, b: string): number {
	const left = a.split(/[.-]/).map((part) => Number.parseInt(part, 10));
	const right = b.split(/[.-]/).map((part) => Number.parseInt(part, 10));
	const max = Math.max(left.length, right.length);
	for (let i = 0; i < max; i++) {
		const av = Number.isNaN(left[i]) ? 0 : (left[i] ?? 0);
		const bv = Number.isNaN(right[i]) ? 0 : (right[i] ?? 0);
		if (av !== bv) return bv - av;
	}
	return b.localeCompare(a);
}

async function listAgents(pluginsRoot: string): Promise<Array<{ plugin: string; file: string; src: string }>> {
	const out: Array<{ plugin: string; file: string; src: string }> = [];
	for (const e of await readdir(pluginsRoot, { withFileTypes: true })) {
		if (!e.isDirectory() || e.name.startsWith(".") || e.name === "_shared") continue;
		const agentsDir = join(pluginsRoot, e.name, "agents");
		if (await exists(agentsDir)) {
			for (const f of await readdir(agentsDir)) {
				if (f.endsWith(".toml")) out.push({ plugin: e.name, file: f, src: join(agentsDir, f) });
			}
			continue;
		}
		const versions = (await readdir(join(pluginsRoot, e.name), { withFileTypes: true }))
			.filter((v) => v.isDirectory() && !v.name.startsWith("."))
			.map((v) => v.name)
			.sort(compareVersionsDesc);
		for (const version of versions) {
			const versionedAgentsDir = join(pluginsRoot, e.name, version, "agents");
			if (!(await exists(versionedAgentsDir))) continue;
			for (const f of await readdir(versionedAgentsDir)) {
				if (f.endsWith(".toml")) out.push({ plugin: e.name, file: f, src: join(versionedAgentsDir, f) });
			}
			break;
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
	const seen = new Set<string>();
	for (const a of agents) {
		if (seen.has(a.file)) {
			p.log.warn(`agent filename collision skipped: ${a.file} from ${a.plugin}`);
			continue;
		}
		seen.add(a.file);
		const legacyLinkPath = join(destDir, `${a.plugin}-${a.file}`);
		if (await exists(legacyLinkPath)) { await unlink(legacyLinkPath); replaced++; }
		const linkPath = join(destDir, a.file);
		if (await exists(linkPath)) { await unlink(linkPath); replaced++; }
		await symlink(a.src, linkPath);
		linked++;
	}
	p.log.success(`Symlinked ${linked} agent(s) into ${destDir}${replaced > 0 ? ` (${replaced} replaced)` : ""}`);
}
