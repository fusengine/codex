import { afterEach, describe, expect, mock, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const roots: string[] = [];

function tempRoot(prefix: string): string {
	const root = mkdtempSync(join(tmpdir(), prefix));
	roots.push(root);
	return root;
}

function writeJson(root: string, path: string, data: unknown): void {
	const file = join(root, path);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(data)}\n`);
}

afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("harnessRange", () => {
	test("returns the pinned @fusengine/harness range from the repo manifest", async () => {
		const { harnessRange } = await import("../lib/install/runtime-deps");
		const root = tempRoot("fusengine-project-");
		writeJson(root, "package.json", { dependencies: { "@fusengine/harness": "^9.9.9" } });
		expect(harnessRange(root)).toBe("^9.9.9");
	});

	test("throws when @fusengine/harness is absent from the repo manifest", async () => {
		const { harnessRange } = await import("../lib/install/runtime-deps");
		const root = tempRoot("fusengine-project-");
		writeJson(root, "package.json", { dependencies: {} });
		expect(() => harnessRange(root)).toThrow(/harness/);
	});
});

/**
 * `installRuntimeDeps` no longer builds or packs `@fusengine/codex-hooks` (removed layer);
 * it only writes the CODEX_HOME manifest and runs `bun install`. The `bun install` step is
 * faked here the same way `harness-debug.test.ts` fakes `@clack/prompts`: `mock.module` the
 * dependency, then dynamic-import the module under test so it picks up the fake.
 */
describe("installRuntimeDeps", () => {
	afterEach(() => mock.restore());

	test("writes a package.json with exactly @fusengine/harness and stages node_modules", async () => {
		mock.module("../lib/install/fs-helpers", () => ({
			installPluginDeps: mock(async (dir: string) => {
				const binDir = join(dir, "node_modules", "@fusengine", "harness", "dist", "cli");
				mkdirSync(binDir, { recursive: true });
				writeFileSync(join(binDir, "bin.mjs"), "");
				return true;
			}),
		}));
		const { installRuntimeDeps } = await import("../lib/install/runtime-deps");

		const projectRoot = tempRoot("fusengine-project-");
		const codexHome = tempRoot("fusengine-codex-home-");
		writeJson(projectRoot, "package.json", { dependencies: { "@fusengine/harness": "^9.9.9" } });

		await installRuntimeDeps(projectRoot, codexHome);

		const pkg = (await Bun.file(join(codexHome, "package.json")).json()) as {
			dependencies: Record<string, string>;
		};
		expect(Object.keys(pkg.dependencies)).toEqual(["@fusengine/harness"]);
		expect(pkg.dependencies["@fusengine/harness"]).toBe("^9.9.9");
		expect([...new Bun.Glob("*.tgz").scanSync(codexHome)]).toEqual([]);
	});

	test("hard-fails when the harness binary is missing after install", async () => {
		mock.module("../lib/install/fs-helpers", () => ({
			installPluginDeps: mock(async () => true), // "installs" without staging any files
		}));
		const { installRuntimeDeps } = await import("../lib/install/runtime-deps");

		const projectRoot = tempRoot("fusengine-project-");
		const codexHome = tempRoot("fusengine-codex-home-");
		writeJson(projectRoot, "package.json", { dependencies: { "@fusengine/harness": "^9.9.9" } });

		await expect(installRuntimeDeps(projectRoot, codexHome)).rejects.toThrow(/@fusengine\/harness missing/);
	});

	test("prunes the legacy @fusengine/codex-hooks node_modules dir and tarball", async () => {
		mock.module("../lib/install/fs-helpers", () => ({
			installPluginDeps: mock(async (dir: string) => {
				const binDir = join(dir, "node_modules", "@fusengine", "harness", "dist", "cli");
				mkdirSync(binDir, { recursive: true });
				writeFileSync(join(binDir, "bin.mjs"), "");
				return true;
			}),
		}));
		const { installRuntimeDeps } = await import("../lib/install/runtime-deps");

		const projectRoot = tempRoot("fusengine-project-");
		const codexHome = tempRoot("fusengine-codex-home-");
		writeJson(projectRoot, "package.json", { dependencies: { "@fusengine/harness": "^9.9.9" } });
		writeJson(codexHome, join("node_modules", "@fusengine", "codex-hooks", "package.json"), { name: "@fusengine/codex-hooks" });
		writeFileSync(join(codexHome, "codex-hooks-deadbeef.tgz"), "");

		await installRuntimeDeps(projectRoot, codexHome);

		expect(existsSync(join(codexHome, "node_modules", "@fusengine", "codex-hooks"))).toBe(false);
		expect([...new Bun.Glob("codex-hooks-*.tgz").scanSync(codexHome)]).toEqual([]);
		const pkg = (await Bun.file(join(codexHome, "package.json")).json()) as {
			dependencies: Record<string, string>;
		};
		expect(Object.keys(pkg.dependencies)).toEqual(["@fusengine/harness"]);
	});
});
