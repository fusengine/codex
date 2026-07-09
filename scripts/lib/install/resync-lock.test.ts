import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { acquireResyncLock, releaseResyncLock } from "./resync-lock";

function tempRoot(): string {
	return mkdtempSync(join(tmpdir(), "codex-resync-lock-"));
}

function lockPath(root: string): string {
	return join(root, "fusengine", "state", "agents-resync.lock");
}

test("acquire then release round-trips cleanly", () => {
	const root = tempRoot();
	expect(acquireResyncLock(root)).toBe(true);
	expect(existsSync(lockPath(root))).toBe(true);
	releaseResyncLock(root);
	expect(existsSync(lockPath(root))).toBe(false);
	rmSync(root, { recursive: true, force: true });
});

test("exclusivity: a second acquire on an already-held lock returns false", () => {
	const root = tempRoot();
	expect(acquireResyncLock(root)).toBe(true);
	expect(acquireResyncLock(root)).toBe(false);
	releaseResyncLock(root);
	rmSync(root, { recursive: true, force: true });
});

test("a lock file already written by another process is not stolen", () => {
	const root = tempRoot();
	mkdirSync(join(root, "fusengine", "state"), { recursive: true });
	writeFileSync(lockPath(root), "99999");
	expect(acquireResyncLock(root)).toBe(false);
	expect(existsSync(lockPath(root))).toBe(true);
	rmSync(root, { recursive: true, force: true });
});

test("a stale lock (mtime older than 30s) is reclaimed", () => {
	const root = tempRoot();
	mkdirSync(join(root, "fusengine", "state"), { recursive: true });
	writeFileSync(lockPath(root), "99999");
	const old = new Date(Date.now() - 60_000);
	utimesSync(lockPath(root), old, old);
	expect(acquireResyncLock(root)).toBe(true);
	releaseResyncLock(root);
	rmSync(root, { recursive: true, force: true });
});

test("releaseResyncLock is best-effort when nothing is held", () => {
	const root = tempRoot();
	expect(() => releaseResyncLock(root)).not.toThrow();
	rmSync(root, { recursive: true, force: true });
});
