import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	fingerprint, hasDanglingSymlink, needsResync, pluginsCacheRoot,
	readFingerprint, resolveCurrentFingerprint, writeFingerprint,
} from "./agents-resync";

function tempRoot(): string {
	return mkdtempSync(join(tmpdir(), "codex-agents-resync-"));
}

test("pluginsCacheRoot joins codexHome/plugins/cache/fusengine-codex", () => {
	expect(pluginsCacheRoot("/home/x/.codex")).toBe(join("/home/x/.codex", "plugins", "cache", "fusengine-codex"));
});

test("fingerprint is order-independent", () => {
	const a = new Map([["alpha", "/a/1.0.0"], ["beta", "/b/2.0.0"]]);
	const b = new Map([["beta", "/b/2.0.0"], ["alpha", "/a/1.0.0"]]);
	expect(fingerprint(a)).toBe(fingerprint(b));
	expect(fingerprint(a)).not.toBe(fingerprint(new Map([["alpha", "/a/1.0.1"]])));
});

test("writeFingerprint + readFingerprint round-trip, no leftover .tmp file", () => {
	const root = tempRoot();
	writeFingerprint(root, "abc123");
	expect(readFingerprint(root)).toBe("abc123");
	const stateDir = join(root, "fusengine", "state");
	expect(readdirSync(stateDir).some((f) => f.endsWith(".tmp"))).toBe(false);
	rmSync(root, { recursive: true, force: true });
});

test("readFingerprint fails open on a corrupted manifest", () => {
	const root = tempRoot();
	const stateDir = join(root, "fusengine", "state");
	mkdirSync(stateDir, { recursive: true });
	writeFileSync(join(stateDir, "agents-cache-fingerprint.json"), "{not json");
	expect(readFingerprint(root)).toBeUndefined();
	rmSync(root, { recursive: true, force: true });
});

test("hasDanglingSymlink detects a broken symlink, is healthy otherwise, and absent dir is safe", () => {
	const root = tempRoot();
	expect(hasDanglingSymlink(join(root, "missing"))).toBe(false);
	const dir = join(root, "prompts");
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(root, "real.md"), "x");
	symlinkSync(join(root, "real.md"), join(dir, "ok.md"));
	expect(hasDanglingSymlink(dir)).toBe(false);
	symlinkSync(join(root, "gone.md"), join(dir, "broken.md"));
	expect(hasDanglingSymlink(dir)).toBe(true);
	rmSync(root, { recursive: true, force: true });
});

test("resolveCurrentFingerprint: absent cache and empty cache both fail open to undefined", async () => {
	const root = tempRoot();
	expect(await resolveCurrentFingerprint(join(root, "missing"))).toBeUndefined();
	const emptyCache = join(root, "cache");
	mkdirSync(emptyCache, { recursive: true });
	expect(await resolveCurrentFingerprint(emptyCache)).toBeUndefined();
	rmSync(root, { recursive: true, force: true });
});

test("resolveCurrentFingerprint resolves the latest versioned plugin root", async () => {
	const root = tempRoot();
	const cache = join(root, "cache");
	mkdirSync(join(cache, "alpha", "1.0.0"), { recursive: true });
	mkdirSync(join(cache, "alpha", "1.2.0"), { recursive: true });
	const resolved = await resolveCurrentFingerprint(cache);
	expect(resolved?.roots.get("alpha")).toBe(join(cache, "alpha", "1.2.0"));
	expect(resolved?.value).toBe(fingerprint(resolved!.roots));
	rmSync(root, { recursive: true, force: true });
});

test("needsResync: stale/never-recorded fingerprint or dangling symlink both trigger true", () => {
	const root = tempRoot();
	const prompts = join(root, "prompts");
	mkdirSync(prompts, { recursive: true });
	expect(needsResync(root, "v1", prompts)).toBe(true);
	writeFingerprint(root, "v1");
	expect(needsResync(root, "v1", prompts)).toBe(false);
	expect(needsResync(root, "v2", prompts)).toBe(true);
	symlinkSync(join(root, "gone"), join(prompts, "broken.md"));
	expect(needsResync(root, "v1", prompts)).toBe(true);
	rmSync(root, { recursive: true, force: true });
});
