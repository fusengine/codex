/**
 * toml-helpers.ts — Minimal regex-based TOML upsert utilities (no parser).
 */

const TABLE_HEADER = /^\s*\[\[?[^\]]+\]\]?\s*(?:#.*)?$/;

function tablePattern(table: string): RegExp {
	const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^\\s*\\[${escaped}\\]\\s*(?:#.*)?$`);
}

/** Whether a root-level key is present. */
export function hasKey(src: string, key: string): boolean {
	return new RegExp(`^${key}\\s*=`, "m").test(src);
}

/**
 * Read a root-level key's value (surrounding double-quotes stripped), or
 * `undefined` if absent. Assumes simple values (enums, booleans, quoted strings
 * with no embedded `#` or `"`); a `#` inside a quoted value is treated as the
 * start of a trailing comment — fine for every current call site (Codex config
 * enums), not TOML-spec-complete.
 */
export function getRootKey(src: string, key: string): string | undefined {
	const match = src.match(new RegExp(`^${key}\\s*=\\s*(.*?)\\s*(?:#.*)?$`, "m"));
	return match?.[1].replace(/^"(.*)"$/, "$1");
}

/**
 * Upsert a root-level key (quoted string or raw value), keeping any trailing
 * `# comment`. Same simple-value assumption as {@link getRootKey}: a `#` inside
 * an existing quoted value would be misread as a comment on rewrite — safe for
 * all current callers (Codex config enums), not TOML-spec-complete.
 */
export function setRootKey(src: string, key: string, value: string, quoted = true): string {
	const line = quoted ? `${key} = "${value}"` : `${key} = ${value}`;
	const pattern = new RegExp(`^${key}\\s*=.*$`, "m");
	const existingLine = src.match(pattern)?.[0];
	if (existingLine === undefined) return `${line}\n${src}`;
	const comment = existingLine.match(/(\s*#.*)$/)?.[1] ?? "";
	return src.replace(pattern, line + comment);
}

/** Delete a root key without scanning past the first explicit TOML table. */
export function removeRootKey(src: string, key: string): string {
	const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const lines = src.split("\n");
	let end = lines.findIndex((candidate) => TABLE_HEADER.test(candidate));
	if (end < 0) end = lines.length;
	const offset = lines.slice(0, end).findIndex((candidate) => new RegExp(`^\\s*${escaped}\\s*=`).test(candidate));
	if (offset < 0) return src;
	lines.splice(offset, 1);
	return lines.join("\n");
}

/** Upsert a raw value inside a TOML table without touching sibling tables. */
export function setTableKey(src: string, table: string, key: string, value: string): string {
	const header = tablePattern(table);
	const line = `${key} = ${value}`;
	const lines = src.split("\n");
	const start = lines.findIndex((candidate) => header.test(candidate));
	if (start < 0) return `${src.trimEnd()}\n\n[${table}]\n${line}\n`;

	let end = lines.findIndex((candidate, index) => index > start && TABLE_HEADER.test(candidate));
	if (end < 0) end = lines.length;
	const offset = lines.slice(start + 1, end).findIndex((candidate) => new RegExp(`^\\s*${key}\\s*=`).test(candidate));
	if (offset >= 0) lines[start + 1 + offset] = line;
	else lines.splice(start + 1, 0, line);
	return lines.join("\n");
}

/** Remove a key from one TOML table while preserving the table and its siblings. */
export function removeTableKey(src: string, table: string, key: string): string {
	const header = tablePattern(table);
	const lines = src.split("\n");
	const start = lines.findIndex((candidate) => header.test(candidate));
	if (start < 0) return src;

	let end = lines.findIndex((candidate, index) => index > start && TABLE_HEADER.test(candidate));
	if (end < 0) end = lines.length;
	const offset = lines.slice(start + 1, end).findIndex((candidate) => new RegExp(`^\\s*${key}\\s*=`).test(candidate));
	if (offset < 0) return src;
	lines.splice(start + 1 + offset, 1);
	return lines.join("\n");
}
