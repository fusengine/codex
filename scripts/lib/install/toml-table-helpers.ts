const TABLE_HEADER = /^\s*\[\[?[^\]]+\]\]?\s*(?:#.*)?$/;

function tableRange(lines: string[], table: string): [number, number] | undefined {
	const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const header = new RegExp(`^\\s*\\[${escaped}\\]\\s*(?:#.*)?$`);
	const start = lines.findIndex((candidate) => header.test(candidate));
	if (start < 0) return undefined;
	const end = lines.findIndex((candidate, index) => index > start && TABLE_HEADER.test(candidate));
	return [start, end < 0 ? lines.length : end];
}

/** Delete a root key without scanning past the first explicit TOML table. */
export function removeRootKey(src: string, key: string): string {
	const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const lines = src.split("\n");
	const end = lines.findIndex((candidate) => TABLE_HEADER.test(candidate));
	const offset = lines.slice(0, end < 0 ? lines.length : end)
		.findIndex((candidate) => new RegExp(`^\\s*${escaped}\\s*=`).test(candidate));
	if (offset < 0) return src;
	lines.splice(offset, 1);
	return lines.join("\n");
}

/** Upsert a raw value inside a TOML table without touching sibling tables. */
export function setTableKey(src: string, table: string, key: string, value: string): string {
	const line = `${key} = ${value}`;
	const lines = src.split("\n");
	const range = tableRange(lines, table);
	if (!range) return `${src.trimEnd()}\n\n[${table}]\n${line}\n`;
	const [start, end] = range;
	const offset = lines.slice(start + 1, end).findIndex((candidate) => new RegExp(`^\\s*${key}\\s*=`).test(candidate));
	if (offset >= 0) lines[start + 1 + offset] = line;
	else lines.splice(start + 1, 0, line);
	return lines.join("\n");
}

/** Whether a key exists inside one explicit TOML table. */
export function hasTableKey(src: string, table: string, key: string): boolean {
	const lines = src.split("\n");
	const range = tableRange(lines, table);
	if (!range) return false;
	const [start, end] = range;
	return lines.slice(start + 1, end).some((candidate) => new RegExp(`^\\s*${key}\\s*=`).test(candidate));
}

/** Remove a key from one TOML table while preserving its siblings. */
export function removeTableKey(src: string, table: string, key: string): string {
	const lines = src.split("\n");
	const range = tableRange(lines, table);
	if (!range) return src;
	const [start, end] = range;
	const offset = lines.slice(start + 1, end).findIndex((candidate) => new RegExp(`^\\s*${key}\\s*=`).test(candidate));
	if (offset < 0) return src;
	lines.splice(start + 1 + offset, 1);
	return lines.join("\n");
}
