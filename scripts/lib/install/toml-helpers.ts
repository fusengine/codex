/**
 * toml-helpers.ts — Minimal regex-based TOML upsert utilities (no parser).
 */

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
