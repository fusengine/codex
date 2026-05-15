/**
 * env-file.ts — Read/write ~/.codex/.env (export KEY="value" format).
 * Single Responsibility: persistence layer for API keys catalog.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function envFilePath(codexHome: string): string {
	return `${codexHome}/.env`;
}

export function loadEnvFile(codexHome: string): Record<string, string> {
	const file = envFilePath(codexHome);
	if (!existsSync(file)) return {};
	const env: Record<string, string> = {};
	for (const line of readFileSync(file, "utf8").split("\n")) {
		const m = line.match(/^export\s+([A-Z_][A-Z0-9_]*)=["']?([^"'\n]*)["']?/);
		if (m) env[m[1]] = m[2];
	}
	return env;
}

export function saveEnvFile(codexHome: string, env: Record<string, string>): void {
	const file = envFilePath(codexHome);
	mkdirSync(dirname(file), { recursive: true });
	const lines = Object.entries(env)
		.filter(([, v]) => v)
		.map(([k, v]) => `export ${k}="${v}"`);
	writeFileSync(file, `${lines.join("\n")}\n`, { mode: 0o600 });
}
