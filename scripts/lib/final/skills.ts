/**
 * skills.ts — Strip non-conformant fields from SKILL.md frontmatter.
 * Doc: developers.openai.com/codex/skills — only `name` and `description`
 * are read by Codex; extras belong in agents/openai.yaml.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

function parseFm(src: string): { fm: Record<string, string>; body: string } | null {
	const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
	if (!m) return null;
	const fm: Record<string, string> = {};
	for (const line of m[1].split("\n")) {
		const kv = line.match(/^([\w-]+)\s*:\s*(.*)$/);
		if (kv) fm[kv[1]] = kv[2];
	}
	return { fm, body: m[2] };
}

function emit(name: string, description: string, body: string): string {
	const d = description.length > 80
		? `description: |\n  ${description.replace(/\n/g, "\n  ")}`
		: `description: ${description}`;
	return `---\nname: ${name}\n${d}\n---\n${body}`;
}

export async function cleanSkills(pluginsRoot: string): Promise<number> {
	let count = 0;
	async function walk(dir: string) {
		for (const e of await readdir(dir, { withFileTypes: true })) {
			const p = join(dir, e.name);
			if (e.isDirectory() && e.name !== "_legacy_py" && e.name !== "node_modules") {
				await walk(p);
			} else if (e.isFile() && e.name === "SKILL.md") {
				const src = await Bun.file(p).text();
				const parsed = parseFm(src);
				if (!parsed?.fm.name || !parsed.fm.description) continue;
				const extra = Object.keys(parsed.fm).filter((k) => k !== "name" && k !== "description");
				if (extra.length === 0) continue;
				await Bun.write(p, emit(parsed.fm.name, parsed.fm.description, parsed.body));
				count++;
			}
		}
	}
	await walk(pluginsRoot);
	console.log(`[OK] ${count} SKILL.md frontmatters cleaned`);
	return count;
}
