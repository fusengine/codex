/**
 * toml-helpers.ts — Minimal regex-based TOML upsert utilities (no parser).
 *
 * Root-level keys only: every lookup/rewrite below is confined to the file's
 * "head" — the span before the first table-header line (`^\[`, e.g.
 * `[profiles.yolo]`). This prevents a same-named key inside any `[table]`
 * from being read or overwritten as if it were a root key.
 *
 * Known limitation (not resolved here, not hit by current callers): a
 * continuation line of a multi-line array value that itself starts with `[`
 * would be misread as a table header, truncating the head early.
 */

const TABLE_HEADER = /^\[/m;

/** Splits `src` into the root-level head (before the first `[table]` header) and the rest. */
function splitHead(src: string): { head: string; tail: string } {
	const match = src.match(TABLE_HEADER);
	if (match?.index === undefined) return { head: src, tail: "" };
	return { head: src.slice(0, match.index), tail: src.slice(match.index) };
}

/** Whether a root-level key is present (root scope only — before the first `[table]`). */
export function hasKey(src: string, key: string): boolean {
	return new RegExp(`^${key}\\s*=`, "m").test(splitHead(src).head);
}

/**
 * Read a root-level key's value (root scope only — before the first
 * `[table]`; surrounding double-quotes stripped), or `undefined` if absent
 * from that scope. Assumes simple values (enums, booleans, quoted strings
 * with no embedded `#` or `"`); a `#` inside a quoted value is treated as the
 * start of a trailing comment — fine for every current call site (Codex
 * config enums), not TOML-spec-complete.
 */
export function getRootKey(src: string, key: string): string | undefined {
	const match = splitHead(src).head.match(new RegExp(`^${key}\\s*=\\s*(.*?)\\s*(?:#.*)?$`, "m"));
	return match?.[1].replace(/^"(.*)"$/, "$1");
}

/**
 * Upsert a root-level key (quoted string or raw value), keeping any trailing
 * `# comment`. Matching and rewriting are confined to the root scope (before
 * the first `[table]`), so a same-named key inside `[profiles.*]` or any
 * other table is never read or clobbered; if absent from the root scope, the
 * key is prefixed at the very top of the file, ahead of any table. Same
 * simple-value assumption as {@link getRootKey}: a `#` inside an existing
 * quoted value would be misread as a comment on rewrite — safe for all
 * current callers (Codex config enums), not TOML-spec-complete.
 */
export function setRootKey(src: string, key: string, value: string, quoted = true): string {
	const line = quoted ? `${key} = "${value}"` : `${key} = ${value}`;
	const { head, tail } = splitHead(src);
	const pattern = new RegExp(`^${key}\\s*=.*$`, "m");
	const existingLine = head.match(pattern)?.[0];
	if (existingLine === undefined) return `${line}\n${src}`;
	const comment = existingLine.match(/(\s*#.*)$/)?.[1] ?? "";
	return head.replace(pattern, line + comment) + tail;
}
