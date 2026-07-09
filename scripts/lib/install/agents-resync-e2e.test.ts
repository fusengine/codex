import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { needsResync, resolveCurrentFingerprint, writeFingerprint } from "./agents-resync";
import { installAgents } from "./install-agents";
import { acquireResyncLock, releaseResyncLock } from "./resync-lock";

function tempRoot(): string {
	return mkdtempSync(join(tmpdir(), "codex-agents-resync-e2e-"));
}

function seedAgent(cache: string, version: string, skillContent: string): void {
	mkdirSync(join(cache, "alpha", version, "agents"), { recursive: true });
	mkdirSync(join(cache, "alpha", version, "skills", "alpha-skill"), { recursive: true });
	writeFileSync(
		join(cache, "alpha", version, "agents", "alpha.toml"),
		'name = "alpha"\n[[skills.config]]\npath = "plugins/alpha/skills/alpha-skill/SKILL.md"\n',
	);
	writeFileSync(join(cache, "alpha", version, "skills", "alpha-skill", "SKILL.md"), skillContent);
}

/** Mirrors the hook's decide-then-act flow (incl. lock) using the exported, unit-testable primitives. */
async function runResyncOnce(
	codexHome: string,
	cache: string,
	promptsDir: string,
): Promise<"synced" | "skipped" | "no-cache" | "locked-skip"> {
	const resolved = await resolveCurrentFingerprint(cache);
	if (!resolved) return "no-cache";
	if (!needsResync(codexHome, resolved.value, promptsDir)) return "skipped";
	if (!acquireResyncLock(codexHome)) return "locked-skip";
	try {
		await installAgents(codexHome, cache, { quiet: true });
		writeFingerprint(codexHome, resolved.value);
		return "synced";
	} finally {
		releaseResyncLock(codexHome);
	}
}

test("first run materializes, re-run is a no-op, a version bump re-materializes", async () => {
	const root = tempRoot();
	const codexHome = join(root, "home");
	const cache = join(root, "cache");
	const promptsDir = join(codexHome, "prompts");
	seedAgent(cache, "1.0.0", "v1");

	expect(await runResyncOnce(codexHome, cache, promptsDir)).toBe("synced");
	expect(readFileSync(join(codexHome, "agents", "alpha.toml"), "utf8")).toContain(
		join(cache, "alpha", "1.0.0", "skills", "alpha-skill", "SKILL.md"),
	);

	expect(await runResyncOnce(codexHome, cache, promptsDir)).toBe("skipped");

	seedAgent(cache, "1.2.0", "v2");
	expect(await runResyncOnce(codexHome, cache, promptsDir)).toBe("synced");
	expect(readFileSync(join(codexHome, "agents", "alpha.toml"), "utf8")).toContain(
		join(cache, "alpha", "1.2.0", "skills", "alpha-skill", "SKILL.md"),
	);

	rmSync(root, { recursive: true, force: true });
});

test("an absent cache is a safe no-op", async () => {
	const root = tempRoot();
	const codexHome = join(root, "home");
	const cache = join(root, "missing-cache");
	expect(await runResyncOnce(codexHome, cache, join(codexHome, "prompts"))).toBe("no-cache");
	rmSync(root, { recursive: true, force: true });
});

test("a second concurrent session skips while the first session holds the lock", async () => {
	const root = tempRoot();
	const codexHome = join(root, "home");
	const cache = join(root, "cache");
	const promptsDir = join(codexHome, "prompts");
	seedAgent(cache, "1.0.0", "v1");

	expect(acquireResyncLock(codexHome)).toBe(true); // session A holds the lock
	expect(await runResyncOnce(codexHome, cache, promptsDir)).toBe("locked-skip"); // session B
	releaseResyncLock(codexHome); // session A finishes

	expect(await runResyncOnce(codexHome, cache, promptsDir)).toBe("synced"); // now free to proceed
	rmSync(root, { recursive: true, force: true });
});
