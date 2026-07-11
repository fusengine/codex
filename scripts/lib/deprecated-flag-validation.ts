import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanupDeprecatedCodexFlags } from "./install/cleanup-deprecated-flags";

function fixture(root: string, path: string, content: string): string {
	const file = join(root, path);
	mkdirSync(file.split("/").slice(0, -1).join("/"), { recursive: true });
	writeFileSync(file, content);
	return file;
}

/** Exercise deprecated flag cleanup against managed and excluded locations. */
export function validateDeprecatedFlagCleanup(): void {
	const root = mkdtempSync(join(tmpdir(), "fusengine-cleanup-"));
	try {
		const managed = [
			fixture(root, "config.toml", "[features]\ncodex_hooks = true\nplugin_hooks = true\n"),
			fixture(root, ".codex-global-state.json", "{\"flag\":\"codex_hooks\"}\n"),
			fixture(root, "vendor_imports/skills/SKILL.md", "legacy [features].codex_hooks and codex_hooks\n"),
			fixture(root, "plugins/cache/fusengine-codex/foo/hooks.json", "{\"hook\":\"codex_hooks\"}\n"),
			fixture(root, ".tmp/marketplaces/fusengine-codex/plugins/foo/README.md", "codex_hooks in tmp marketplace\n"),
		];
		const skipped = ["sessions/log.md", "memories/note.md", "logs/runtime.txt", "node_modules/pkg/readme.md"]
			.map((path) => fixture(root, path, "codex_hooks must remain\n"));
		const changed = cleanupDeprecatedCodexFlags(root);
		if (changed !== managed.length) throw new Error(`cleanup changed ${changed}, expected ${managed.length}`);
		for (const file of managed) if (readFileSync(file, "utf8").includes("codex_hooks")) {
			throw new Error(`deprecated flag remained in ${file}`);
		}
		for (const file of skipped) if (!readFileSync(file, "utf8").includes("codex_hooks")) {
			throw new Error(`excluded file was rewritten: ${file}`);
		}
	} finally {
		rmSync(root, { force: true, recursive: true });
	}
}
