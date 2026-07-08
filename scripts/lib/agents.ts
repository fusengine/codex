import { join } from "node:path";
import { mkdir, readdir } from "node:fs/promises";
import { buildAgentToml } from "./agent-toml.ts";
import { buildAgentTomlOptions } from "./agent-skills.ts";

/**
 * Transform every codex-plugins/<plugin>/agents/*.md into a matching
 * codex-plugins/<plugin>/agents/<name>.toml file.
 */
export async function transformAgents(
	srcDir: string,
	destDir: string,
): Promise<{ converted: number; errors: string[] }> {
	const errors: string[] = [];
	const srcAgents = join(srcDir, "agents");
	let entries: string[];
	try {
		entries = await readdir(srcAgents);
	} catch {
		return { converted: 0, errors };
	}
	const destAgents = join(destDir, "agents");
	await mkdir(destAgents, { recursive: true });
	const tomlOptions = await buildAgentTomlOptions(srcDir, destDir);

	let converted = 0;
	for (const entry of entries) {
		if (!entry.endsWith(".md")) continue;
		const srcFile = join(srcAgents, entry);
		try {
			const raw = await Bun.file(srcFile).text();
			const toml = buildAgentToml(raw, tomlOptions);
			const outName = entry.replace(/\.md$/, ".toml");
			await Bun.write(join(destAgents, outName), toml);
			converted++;
		} catch (e) {
			errors.push(`agents/${entry}: ${(e as Error).message}`);
		}
	}
	return { converted, errors };
}
