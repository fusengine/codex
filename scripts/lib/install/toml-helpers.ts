/**
 * toml-helpers.ts — Minimal regex-based TOML upsert utilities (no parser).
 */

const AGENTS_SECTION = /^\[agents\]\s*$/m;

/** Whether a root-level key is present. */
export function hasKey(src: string, key: string): boolean {
	return new RegExp(`^${key}\\s*=`, "m").test(src);
}

/** Upsert a root-level key (quoted string or raw value). */
export function setRootKey(src: string, key: string, value: string, quoted = true): string {
	const line = quoted ? `${key} = "${value}"` : `${key} = ${value}`;
	if (hasKey(src, key)) return src.replace(new RegExp(`^${key}\\s*=.*$`, "m"), line);
	return `${line}\n${src}`;
}

/** Whether the [agents] table exists. */
export function hasAgentsSection(src: string): boolean {
	return AGENTS_SECTION.test(src);
}

/** Upsert [agents].max_threads as an unquoted integer, scoped to the table. */
export function setAgentsThreads(src: string, value: string): string {
	const line = `max_threads = ${value}`;
	if (!AGENTS_SECTION.test(src)) return `${src}\n[agents]\n${line}\n`;
	const lines = src.split("\n");
	const start = lines.findIndex((l) => /^\[agents\]\s*$/.test(l));
	let end = lines.findIndex((l, i) => i > start && /^\[/.test(l));
	if (end < 0) end = lines.length;
	const at = lines.slice(start + 1, end).findIndex((l) => /^max_threads\s*=/.test(l));
	if (at >= 0) lines[start + 1 + at] = line;
	else lines.splice(start + 1, 0, line);
	return lines.join("\n");
}
