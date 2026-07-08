import { basename, dirname, join } from "node:path";
import { buildSkillIndex, buildVersionIndex, readSkillNames } from "./agent-plugin-index.ts";
import type { AgentTomlOptions } from "./agent.types.ts";

export async function buildAgentTomlOptions(srcDir: string, destDir: string): Promise<AgentTomlOptions> {
	const codexHome = process.env.CODEX_HOME ?? join(process.env.HOME ?? "/Users/username", ".codex");
	const cacheRoot = join(codexHome, "plugins/cache/fusengine-codex");
	const roots = [dirname(destDir), dirname(srcDir)];
	const pluginName = basename(destDir);
	const [fallbackSkillNames, skillIndex, versionByPlugin] = await Promise.all([
		readFallbackSkillNames(srcDir, destDir),
		buildSkillIndex(roots),
		buildVersionIndex([cacheRoot, ...roots]),
	]);

	return {
		fallbackSkillNames,
		resolveSkillPaths: (skillNames) =>
			skillNames.map((skillName) => {
				const owner = resolveSkillOwner(skillName, pluginName, skillIndex);
				const version = versionByPlugin.get(owner);
				if (!version) throw new Error(`Missing plugin version for ${owner}:${skillName}`);
				return join(
					codexHome,
					"plugins/cache/fusengine-codex",
					owner,
					version,
					"skills",
					skillName,
					"SKILL.md",
				);
			}),
	};
}

async function readFallbackSkillNames(srcDir: string, destDir: string): Promise<string[]> {
	const destSkills = await readSkillNames(join(destDir, "skills"));
	return destSkills.length > 0 ? destSkills : readSkillNames(join(srcDir, "skills"));
}

function resolveSkillOwner(skillName: string, pluginName: string, skillIndex: Map<string, string[]>): string {
	const owners = skillIndex.get(skillName) ?? [];
	if (owners.includes(pluginName)) return pluginName;
	if (owners.length === 1) return owners[0];
	if (owners.length === 0) throw new Error(`Unresolved skill ${skillName}`);
	throw new Error(`Ambiguous skill ${skillName}: ${owners.join(", ")}`);
}
