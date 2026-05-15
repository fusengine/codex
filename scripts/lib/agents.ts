import { join } from "node:path";
import { mkdir, readdir } from "node:fs/promises";
import { parseFrontmatter, escapeTripleQuoted } from "./yaml.ts";

/**
 * Codex model → Codex model mapping.
 * Codex agents use the `model` config.toml key; values follow the
 * gpt-5.3-codex-* family announced in 2026.
 */
const MODEL_MAP: Record<string, string> = {
	opus: "gpt-5.3-codex-spark",
	sonnet: "gpt-5.3-codex",
	haiku: "gpt-5.3-codex-mini",
};

/**
 * Tool names that imply write access. If none of these appear in the
 * Codex agent's `tools` list, the Codex agent is restricted to read-only.
 */
const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

function mapModel(claudeModel: string | undefined): string {
	if (!claudeModel) return "gpt-5.3-codex";
	return MODEL_MAP[claudeModel] ?? claudeModel;
}

function sandboxFor(tools: string[] | undefined): string {
	if (!tools || tools.length === 0) return "read-only";
	return tools.some((t) => WRITE_TOOLS.has(t)) ? "workspace-write" : "read-only";
}

function tomlString(value: string): string {
	const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	return `"${escaped}"`;
}

/**
 * Convert a single Codex agent .md file (YAML frontmatter + markdown body)
 * into a Codex agent .toml file matching the schema from
 * developers.openai.com/codex/subagents.
 */
function buildAgentToml(raw: string): string {
	const { data, body } = parseFrontmatter(raw);
	const name = String(data.name ?? "unnamed");
	const description = String(data.description ?? "");
	const model = mapModel(String(data.model ?? ""));
	const tools = Array.isArray(data.tools) ? data.tools : data.tools ? [String(data.tools)] : [];
	const sandbox = sandboxFor(tools);
	const instructions = escapeTripleQuoted(body.trim());

	const lines = [
		`name = ${tomlString(name)}`,
		`description = ${tomlString(description)}`,
		`model = ${tomlString(model)}`,
		`sandbox_mode = ${tomlString(sandbox)}`,
		`developer_instructions = """`,
		instructions,
		`"""`,
		"",
	];
	return lines.join("\n");
}

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

	let converted = 0;
	for (const entry of entries) {
		if (!entry.endsWith(".md")) continue;
		const srcFile = join(srcAgents, entry);
		try {
			const raw = await Bun.file(srcFile).text();
			const toml = buildAgentToml(raw);
			const outName = entry.replace(/\.md$/, ".toml");
			await Bun.write(join(destAgents, outName), toml);
			converted++;
		} catch (e) {
			errors.push(`agents/${entry}: ${(e as Error).message}`);
		}
	}
	return { converted, errors };
}
