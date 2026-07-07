import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { installPluginCache } from "../lib/install/plugin-cache";
import { harnessRange, installRuntimeDeps } from "../lib/install/runtime-deps";

const roots: string[] = [];
const repoRoot = join(import.meta.dir, "..", "..");

function tempRoot(prefix: string): string {
	const root = mkdtempSync(join(tmpdir(), prefix));
	roots.push(root);
	return root;
}

async function copyFixture(root: string, path: string): Promise<void> {
	await cp(join(repoRoot, path), join(root, path), { force: true, recursive: true });
}

async function pluginVersion(root: string, name: string): Promise<string> {
	const path = join(root, "plugins", name, ".codex-plugin", "plugin.json");
	const manifest = (await Bun.file(path).json()) as { version?: string };
	return manifest.version ?? "0.0.0";
}

function writeJson(root: string, path: string, data: unknown): void {
	const file = join(root, path);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(data)}\n`);
}

function wrapperEnv(codexHome: string): Record<string, string> {
	return {
		CODEX_HOME: codexHome,
		FUSENGINE_SYS: join(codexHome, "fusengine-sys"),
		HOME: process.env.HOME ?? "",
		PATH: process.env.PATH ?? "",
		TMPDIR: process.env.TMPDIR ?? tmpdir(),
	};
}

afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("installed plugin bundle", () => {
	// Regression guard for the removed `installRuntimeShared`: the @hook-entry
	// bundle must run self-contained from the plugin cache, with NO
	// `_shared/scripts` staged anywhere on disk (imports are inlined at build).
	test("runs a cached wrapper without any staged shared scripts", async () => {
		const projectRoot = tempRoot("fusengine-project-");
		const codexHome = tempRoot("fusengine-codex-home-");
		await copyFixture(projectRoot, "plugins/react-expert");
		// installPluginCache builds the @hook-entry bundles on the fly; copy the
		// cross-plugin sources react-expert imports so Bun.build can INLINE them.
		// This is a build-time source dependency, NOT a runtime staged tree.
		await copyFixture(projectRoot, "plugins/_shared/scripts");
		await copyFixture(projectRoot, "plugins/core-guards/scripts/_shared");
		await copyFixture(projectRoot, "plugins/ai-pilot/scripts/lib");

		writeJson(projectRoot, "plugins/react-expert/scripts/__pycache__/ignored.pyc", {});

		const installed = await installPluginCache(projectRoot, codexHome, "fusengine-codex");
		const version = await pluginVersion(projectRoot, "react-expert");
		const pluginRoot = join(codexHome, `plugins/cache/fusengine-codex/react-expert/${version}`);
		const wrapper = join(pluginRoot, "dist/hooks/check-skill-loaded.native.js");
		const cacheFallback = join(pluginRoot, "..", "_shared", "scripts");
		const runtimeShared = join(codexHome, "fusengine-sys", "shared", "scripts");
		const payload = JSON.stringify({
			session_id: "runtime-shared-test",
			tool_name: "apply_patch",
			tool_input: { file_path: "/tmp/not-react.txt", content: "noop" },
		});
		const proc = Bun.spawn(["bun", wrapper], {
			env: wrapperEnv(codexHome),
			stderr: "pipe",
			stdin: "pipe",
			stdout: "pipe",
		});
		proc.stdin.write(payload);
		proc.stdin.end();
		const [stderr, exitCode] = await Promise.all([new Response(proc.stderr).text(), proc.exited]);

		expect(installed).toBe(1);
		expect(existsSync(cacheFallback)).toBe(false);
		expect(existsSync(runtimeShared)).toBe(false);
		expect(stderr).toBe("");
		expect(exitCode).toBe(0);
	});
});

describe("harnessRange", () => {
	test("returns the pinned @fusengine/harness range from the repo manifest", () => {
		const root = tempRoot("fusengine-project-");
		writeJson(root, "package.json", { dependencies: { "@fusengine/harness": "^9.9.9" } });
		expect(harnessRange(root)).toBe("^9.9.9");
	});

	test("throws when @fusengine/harness is absent from the repo manifest", () => {
		const root = tempRoot("fusengine-project-");
		writeJson(root, "package.json", { dependencies: {} });
		expect(() => harnessRange(root)).toThrow(/harness/);
	});
});

describe("installRuntimeDeps", () => {
	// buildAndPackHooks copies packages/codex-hooks/package.json first; an empty
	// projectRoot has none, so the copy rejects and setup aborts — no silent no-op.
	test("aborts when the hooks package definition is missing", async () => {
		const projectRoot = tempRoot("fusengine-project-");
		const codexHome = tempRoot("fusengine-codex-home-");
		await expect(installRuntimeDeps(projectRoot, codexHome)).rejects.toThrow();
	});
});
