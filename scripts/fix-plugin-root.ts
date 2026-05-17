#!/usr/bin/env bun
/* Replace ${CODEX_PLUGIN_ROOT} → ${PLUGIN_ROOT} across all plugin hooks.json
 * (PLUGIN_ROOT is the native Codex env var; CODEX_PLUGIN_ROOT does not exist). */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "plugins");
let n = 0;
for (const d of await readdir(root)) {
	const f = join(root, d, "hooks", "hooks.json");
	const file = Bun.file(f);
	if (!(await file.exists())) continue;
	const src = await file.text();
	const next = src.replaceAll("${CODEX_PLUGIN_ROOT}", "${PLUGIN_ROOT}");
	if (next !== src) {
		await Bun.write(f, next);
		n++;
		console.log(`OK ${d}/hooks/hooks.json`);
	}
}
console.log(`Done. ${n} file(s) rewrote.`);
