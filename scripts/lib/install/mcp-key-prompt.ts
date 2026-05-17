/**
 * mcp-key-prompt.ts — Prompt for missing API keys needed by selected MCPs.
 * Mirrors claude-plugins/scripts/src/services/mcp-key-prompt.ts pattern.
 */
import * as p from "@clack/prompts";
import { MCP_CATALOG } from "./mcp-catalog";
import { envFilePath, loadEnvFile, saveEnvFile } from "./env-file";

export async function promptMissingKeys(codexHome: string, selected: Set<string>): Promise<void> {
	const env = loadEnvFile(codexHome);
	const missing = [...selected]
		.map((name) => ({ name, meta: MCP_CATALOG[name] }))
		.filter(({ meta }) => meta?.requiresApiKey && meta.apiKeyEnv)
		.filter(({ meta }) => !env[meta.apiKeyEnv!] && !process.env[meta.apiKeyEnv!]);

	if (missing.length === 0) return;

	p.note(
		missing.map(({ meta }) => `  ${meta.apiKeyEnv}`).join("\n"),
		`${missing.length} API key(s) required`,
	);

	let changes = 0;
	for (const { name, meta } of missing) {
		const value = await p.text({
			message: meta.apiKeyEnv!,
			placeholder: meta.apiKeyUrl ?? `${name} — ${meta.description}`,
		});
		if (p.isCancel(value)) break;
		const v = (value ?? "").trim();
		if (v) {
			env[meta.apiKeyEnv!] = v;
			process.env[meta.apiKeyEnv!] = v;
			changes++;
		}
	}

	if (changes > 0) {
		saveEnvFile(codexHome, env);
		p.log.success(`Saved ${changes} key(s) → ${envFilePath(codexHome)} (chmod 600)`);
	}
}
