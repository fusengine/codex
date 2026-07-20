/**
 * env-file.test.ts — saveEnvFile must upsert in place, never wholesale-rewrite: comments,
 * non-`export` lines, empty-value lines, and line order all survive a round trip. A key
 * absent from the in-memory dict (explicit `delete`) is removed; a key present with an
 * empty string is kept (empty is not "delete").
 */
import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnvFile, saveEnvFile } from "./env-file";

function tmpCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-env-file-"));
}

test("comments, non-export lines, and empty-value lines survive an unrelated upsert", () => {
	const home = tmpCodexHome();
	const before = '# my codex env\nOPENAI_API_KEY=sk-plain-no-export\nexport FOO="bar"\nexport EMPTY=""\n';
	writeFileSync(join(home, ".env"), before, { mode: 0o600 });

	const env = loadEnvFile(home);
	env.FUSE_HARNESS_MARKETPLACES = "fusengine-codex";
	saveEnvFile(home, env);

	const after = readFileSync(join(home, ".env"), "utf8");
	expect(after).toContain("# my codex env");
	expect(after).toContain("OPENAI_API_KEY=sk-plain-no-export");
	expect(after).toContain('FOO="bar"');
	expect(after).toContain('EMPTY=""');
	expect(after).toContain("fusengine-codex");
	rmSync(home, { recursive: true, force: true });
});

test("loadEnvFile reads KEY=value without export, not just export KEY=value", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), "OPENAI_API_KEY=sk-plain-no-export\n", { mode: 0o600 });
	expect(loadEnvFile(home).OPENAI_API_KEY).toBe("sk-plain-no-export");
	rmSync(home, { recursive: true, force: true });
});

test("updating a key rewrites it in place, at the same line position", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export A="1"\nexport B="2"\nexport C="3"\n', { mode: 0o600 });
	const env = loadEnvFile(home);
	env.B = "changed";
	saveEnvFile(home, env);
	const lines = readFileSync(join(home, ".env"), "utf8").split("\n").filter(Boolean);
	expect(lines).toEqual(['export A="1"', 'export B="changed"', 'export C="3"']);
	rmSync(home, { recursive: true, force: true });
});

test("a brand-new key is appended at the end", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export A="1"\n', { mode: 0o600 });
	const env = loadEnvFile(home);
	env.NEW_KEY = "new-value";
	saveEnvFile(home, env);
	const content = readFileSync(join(home, ".env"), "utf8");
	const lines = content.split("\n").filter(Boolean);
	expect(lines[0]).toBe('export A="1"');
	expect(content).toContain('NEW_KEY="new-value"');
	rmSync(home, { recursive: true, force: true });
});

test("a key explicitly deleted from the dict (delete env[k]) has its line removed", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export A="1"\nexport B="2"\n', { mode: 0o600 });
	const env = loadEnvFile(home);
	delete env.B;
	saveEnvFile(home, env);
	const content = readFileSync(join(home, ".env"), "utf8");
	expect(content).toContain('export A="1"');
	expect(content).not.toContain("B=");
	rmSync(home, { recursive: true, force: true });
});

test("an untouched empty-value key is not dropped just because its value is falsy", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export EMPTY=""\nexport A="1"\n', { mode: 0o600 });
	const env = loadEnvFile(home);
	env.A = "changed";
	saveEnvFile(home, env);
	const content = readFileSync(join(home, ".env"), "utf8");
	expect(content).toContain('EMPTY=""');
	rmSync(home, { recursive: true, force: true });
});

test("file mode stays 0o600 after an upsert on a pre-existing file", () => {
	const home = tmpCodexHome();
	writeFileSync(join(home, ".env"), 'export A="1"\n', { mode: 0o600 });
	const env = loadEnvFile(home);
	env.A = "2";
	saveEnvFile(home, env);
	const mode = statSync(join(home, ".env")).mode & 0o777;
	expect(mode).toBe(0o600);
	rmSync(home, { recursive: true, force: true });
});
