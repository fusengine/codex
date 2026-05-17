#!/usr/bin/env bun
/* Replace matcher "apply_patch" → "Write|Edit|apply_patch" across all plugin
 * hooks.json. Codex 0.130 recognizes Write/Edit aliases (per fusengine/codex-agent)
 * even when standalone "apply_patch" PreToolUse doesn't fire (issue #16732). */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "plugins");
let n = 0;
for (const d of await readdir(root)) {
	const f = join(root, d, "hooks", "hooks.json");
	const file = Bun.file(f);
	if (!(await file.exists())) continue;
	const src = await file.text();
	const next = src.replaceAll('"matcher": "apply_patch"', '"matcher": "Write|Edit|apply_patch"');
	if (next !== src) {
		await Bun.write(f, next);
		n++;
		console.log(`OK ${d}/hooks/hooks.json`);
	}
}
console.log(`Done. ${n} file(s) rewrote.`);
