import { join } from "node:path";
import { mkdir, readdir } from "node:fs/promises";
import { parseFrontmatter, stringifyFrontmatter } from "./yaml.ts";

/**
 * Codex has no custom slash commands. Each Codex slash command is migrated
 * into a Codex skill: `codex-plugins/<plugin>/skills/<name>/SKILL.md`.
 * Source: developers.openai.com/codex/skills
 */
function buildSkillMd(raw: string, name: string): string {
	const { data, body } = parseFrontmatter(raw);
	const description = String(data.description ?? "").trim();
	const newDescription = description
		? `${description} (migré depuis slash command)`
		: "Migré depuis slash command Codex.";
	const frontmatter = stringifyFrontmatter({
		name,
		description: newDescription,
	});
	return `---\n${frontmatter}\n---\n\n${body.trim()}\n`;
}

/**
 * Transform every codex-plugins/<plugin>/commands/*.md into a Codex skill
 * directory under codex-plugins/<plugin>/skills/<name>/SKILL.md.
 */
export async function transformCommands(
	srcDir: string,
	destDir: string,
): Promise<{ converted: number; errors: string[] }> {
	const errors: string[] = [];
	const srcCommands = join(srcDir, "commands");
	let entries: string[];
	try {
		entries = await readdir(srcCommands);
	} catch {
		return { converted: 0, errors };
	}

	let converted = 0;
	for (const entry of entries) {
		if (!entry.endsWith(".md")) continue;
		const name = entry.replace(/\.md$/, "");
		const srcFile = join(srcCommands, entry);
		try {
			const raw = await Bun.file(srcFile).text();
			const skillMd = buildSkillMd(raw, name);
			const skillDir = join(destDir, "skills", name);
			await mkdir(skillDir, { recursive: true });
			await Bun.write(join(skillDir, "SKILL.md"), skillMd);
			converted++;
		} catch (e) {
			errors.push(`commands/${entry}: ${(e as Error).message}`);
		}
	}
	return { converted, errors };
}
