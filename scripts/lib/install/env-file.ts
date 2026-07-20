/**
 * env-file.ts — Read/write ~/.codex/.env (export KEY="value" format).
 * Single Responsibility: persistence layer for API keys catalog.
 *
 * `saveEnvFile` is a targeted UPSERT against the file on disk, never a wholesale rewrite:
 * comments, blank lines, non-`export` assignments, and line order are all preserved. A key
 * present in `env` (even with an empty string) is kept/updated in place; a key ABSENT from
 * `env` (because a caller did `delete env[KEY]`) has its line removed. New keys are appended
 * at the end as `export KEY="value"`. An existing bare `KEY=value` line (no `export`, no
 * quotes) keeps that exact form when its value is updated — we never silently upgrade it to
 * `export KEY="value"`, since that line may be hand-written (e.g. a plain API key) and its
 * shape is not ours to change.
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/** Matches an optionally-`export`-prefixed `KEY=value` assignment line. */
const ASSIGNMENT_RE = /^(export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$/;

export function envFilePath(codexHome: string): string {
	return `${codexHome}/.env`;
}

/** Strip a matching pair of surrounding quotes, recording which quote char (if any) was used. */
function parseValue(raw: string): { value: string; quote: '"' | "'" | "" } {
	if (raw.length >= 2 && raw[0] === '"' && raw.at(-1) === '"') return { value: raw.slice(1, -1), quote: '"' };
	if (raw.length >= 2 && raw[0] === "'" && raw.at(-1) === "'") return { value: raw.slice(1, -1), quote: "'" };
	return { value: raw, quote: "" };
}

/** Read raw file lines, dropping the single trailing empty line produced by a final `\n`. */
function readRawLines(file: string): string[] {
	if (!existsSync(file)) return [];
	const lines = readFileSync(file, "utf8").split("\n");
	if (lines.length > 0 && lines.at(-1) === "") lines.pop();
	return lines;
}

export function loadEnvFile(codexHome: string): Record<string, string> {
	const env: Record<string, string> = {};
	for (const line of readRawLines(envFilePath(codexHome))) {
		const m = line.match(ASSIGNMENT_RE);
		if (m) env[m[2]] = parseValue(m[3]).value;
	}
	return env;
}

/** Re-quote `value` using `quote`'s style, or leave bare when the original line had no quotes. */
function formatValue(value: string, quote: '"' | "'" | ""): string {
	return quote === "" ? value : `${quote}${value}${quote}`;
}

/**
 * Upsert `env` into `${codexHome}/.env` on disk, preserving comments, blank lines, non-
 * `export` lines, and ordering. Keys present in `env` are updated in place (or appended if
 * new); keys absent from `env` but present on disk are removed. Mode is (re)applied to 0o600
 * on every write, since `writeFileSync`'s `mode` option is ignored by POSIX when the file
 * already exists.
 */
export function saveEnvFile(codexHome: string, env: Record<string, string>): void {
	const file = envFilePath(codexHome);
	mkdirSync(dirname(file), { recursive: true });
	const handled = new Set<string>();
	const lines: string[] = [];
	for (const line of readRawLines(file)) {
		const m = line.match(ASSIGNMENT_RE);
		if (!m) {
			lines.push(line);
			continue;
		}
		const [, prefix = "", key] = m;
		if (!Object.hasOwn(env, key)) continue; // deleted key → drop the line
		handled.add(key);
		const { quote } = parseValue(m[3]);
		lines.push(`${prefix}${key}=${formatValue(env[key] as string, quote)}`);
	}
	for (const [key, value] of Object.entries(env)) {
		if (!handled.has(key)) lines.push(`export ${key}="${value}"`);
	}
	writeFileSync(file, `${lines.join("\n")}\n`, { mode: 0o600 });
	chmodSync(file, 0o600); // writeFileSync's `mode` is ignored by POSIX when the file pre-exists
}
