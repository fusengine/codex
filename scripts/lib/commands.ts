import { join } from "node:path";
import { cp, mkdir, readdir } from "node:fs/promises";

/**
 * Preserve every <plugin>/commands/*.md as a Codex custom prompt command.
 * The installer exposes these Markdown files from $CODEX_HOME/prompts.
 * Source: developers.openai.com/codex/custom-prompts
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
		const srcFile = join(srcCommands, entry);
		try {
			const destCommands = join(destDir, "commands");
			await mkdir(destCommands, { recursive: true });
			await cp(srcFile, join(destCommands, entry));
			converted++;
		} catch (e) {
			errors.push(`commands/${entry}: ${(e as Error).message}`);
		}
	}
	return { converted, errors };
}
