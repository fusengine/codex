/**
 * Minimal YAML frontmatter parser. Bun-native, no deps.
 * Handles: scalar strings, comma-separated inline lists, quoted strings.
 */

export interface Frontmatter {
	data: Record<string, string | string[]>;
	body: string;
}

export function parseFrontmatter(raw: string): Frontmatter {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		return { data: {}, body: raw };
	}
	const data = parseYamlBlock(match[1]);
	const body = match[2] ?? "";
	return { data, body };
}

function parseYamlBlock(block: string): Record<string, string | string[]> {
	const out: Record<string, string | string[]> = {};
	for (const rawLine of block.split(/\r?\n/)) {
		const line = rawLine.replace(/\s+$/, "");
		if (!line || line.startsWith("#")) continue;
		const idx = line.indexOf(":");
		if (idx <= 0) continue;
		const key = line.slice(0, idx).trim();
		const value = line.slice(idx + 1).trim();
		out[key] = parseValue(value);
	}
	return out;
}

function parseValue(value: string): string | string[] {
	if (!value) return "";
	const unquoted = stripQuotes(value);
	if (unquoted !== value) return unquoted;
	if (value.includes(",")) {
		return value.split(",").map((p) => stripQuotes(p.trim())).filter(Boolean);
	}
	return value;
}

function stripQuotes(s: string): string {
	if (s.length >= 2) {
		const first = s[0];
		const last = s[s.length - 1];
		if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
			return s.slice(1, -1);
		}
	}
	return s;
}

/**
 * Escape a string for inclusion in a TOML triple-quoted literal.
 */
export function escapeTripleQuoted(s: string): string {
	return s.replace(/"""/g, '""\\"');
}

/**
 * Serialize a flat key/value map into YAML frontmatter body (no --- delimiters).
 */
export function stringifyFrontmatter(data: Record<string, string | string[]>): string {
	const lines: string[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (Array.isArray(value)) {
			lines.push(`${key}: ${value.join(", ")}`);
		} else {
			lines.push(`${key}: ${value}`);
		}
	}
	return lines.join("\n");
}
