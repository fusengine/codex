/**
 * harness-marketplaces.test.ts — ensureHarnessMarketplace is unconditional, idempotent, and
 * never destroys an existing FUSE_HARNESS_MARKETPLACES value or unrelated .env content.
 * purgeLegacyAskedMarker actively drops the removed _FUSENGINE_HARNESS_ASKED key.
 */
import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureHarnessMarketplace, purgeLegacyAskedMarker } from "./harness-marketplaces";
import { loadEnvFile } from "./env-file";

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-harness-marketplaces-"));
}

test("writes FUSE_HARNESS_MARKETPLACES=fusengine-codex when unset", () => {
	const home = tmpCodexHome();
	ensureHarnessMarketplace(home);
	expect(loadEnvFile(home).FUSE_HARNESS_MARKETPLACES).toBe("fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test("appends fusengine-codex to an existing list without dropping other entries", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_HARNESS_MARKETPLACES="fusengine-plugins"\n', { mode: 0o600 });
	ensureHarnessMarketplace(home);
	expect(loadEnvFile(home).FUSE_HARNESS_MARKETPLACES).toBe("fusengine-plugins,fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test("is a true no-op when fusengine-codex is already present (file untouched)", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export FUSE_HARNESS_MARKETPLACES="fusengine-plugins,fusengine-codex"\n', { mode: 0o600 });
	const before = statSync(join(home, ".env")).mtimeMs;
	ensureHarnessMarketplace(home);
	const after = statSync(join(home, ".env")).mtimeMs;
	expect(after).toBe(before);
	expect(readFileSync(join(home, ".env"), "utf8")).toContain("fusengine-plugins,fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test("preserves unrelated existing vars in .env", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export OPENAI_API_KEY="sk-test"\n', { mode: 0o600 });
	ensureHarnessMarketplace(home);
	const env = loadEnvFile(home);
	expect(env.OPENAI_API_KEY).toBe("sk-test");
	expect(env.FUSE_HARNESS_MARKETPLACES).toBe("fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test(".env stays chmod 600 after write", () => {
	const home = tmpCodexHome();
	ensureHarnessMarketplace(home);
	const mode = statSync(join(home, ".env")).mode & 0o777;
	expect(mode).toBe(0o600);
	rmSync(home, { recursive: true, force: true });
});

test("purgeLegacyAskedMarker drops the removed _FUSENGINE_HARNESS_ASKED key", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export _FUSENGINE_HARNESS_ASKED="1"\nexport OPENAI_API_KEY="sk-test"\n', { mode: 0o600 });
	purgeLegacyAskedMarker(home);
	const env = loadEnvFile(home);
	expect(env._FUSENGINE_HARNESS_ASKED).toBeUndefined();
	expect(env.OPENAI_API_KEY).toBe("sk-test");
	rmSync(home, { recursive: true, force: true });
});

test("purgeLegacyAskedMarker is a no-op when the marker is already absent", () => {
	const home = tmpCodexHome();
	purgeLegacyAskedMarker(home);
	expect(loadEnvFile(home)).toEqual({});
	rmSync(home, { recursive: true, force: true });
});
