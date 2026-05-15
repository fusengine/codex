/**
 * env-prompt.ts — Interactive prompt to fill missing API keys.
 * Uses @clack/prompts. Cancelable per-key (Enter skips, Esc aborts flow).
 */
import * as p from "@clack/prompts";
import { API_KEYS, type EnvKey } from "./env-keys";
import { envFilePath, loadEnvFile, saveEnvFile } from "./env-file";

function placeholder(k: EnvKey): string {
	return k.url ? `${k.description} — ${k.url}` : k.description;
}

export async function promptApiKeys(codexHome: string): Promise<void> {
	const existing = loadEnvFile(codexHome);
	const updated: Record<string, string> = { ...existing };
	let changes = 0;
	let configured = 0;

	p.log.step("API keys configuration");

	for (const key of API_KEYS) {
		if (existing[key.name] || process.env[key.name]) {
			configured++;
			continue;
		}
		const value = await p.text({
			message: key.name,
			placeholder: placeholder(key),
			defaultValue: "",
		});
		if (p.isCancel(value)) {
			p.log.warn("Skipped remaining keys");
			break;
		}
		const v = (value ?? "").trim();
		if (v) {
			updated[key.name] = v;
			changes++;
		}
	}

	if (changes > 0) {
		saveEnvFile(codexHome, updated);
		p.log.success(`Saved ${changes} key(s) to ${envFilePath(codexHome)} (chmod 600)`);
	} else if (configured === API_KEYS.length) {
		p.log.success("All API keys already configured");
	} else {
		p.log.info("No new keys configured");
	}
}
