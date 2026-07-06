import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { installPluginCache } from "../lib/install/plugin-cache";
import { installRuntimeShared } from "../lib/install/runtime-shared";

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

describe("installRuntimeShared", () => {
	test("runs an installed wrapper through fusengine-sys shared scripts", async () => {
		const projectRoot = tempRoot("fusengine-project-");
		const codexHome = tempRoot("fusengine-codex-home-");
		await copyFixture(projectRoot, "plugins/_shared/scripts");
		await copyFixture(projectRoot, "plugins/react-expert");
		// react-expert @hook-entry scripts inline (Bun.build) transitive imports
		// into core-guards/_shared and ai-pilot/scripts/lib — copy both so the
		// bundle resolves on disk, mirroring the real marketplace layout.
		await copyFixture(projectRoot, "plugins/core-guards/scripts/_shared");
		await copyFixture(projectRoot, "plugins/ai-pilot/scripts/lib");

		writeJson(projectRoot, "plugins/_shared/scripts/__pycache__/ignored.pyc", {});

		const dest = await installRuntimeShared(projectRoot, codexHome);
		const installed = await installPluginCache(projectRoot, codexHome, "fusengine-codex");
		const version = await pluginVersion(projectRoot, "react-expert");
		const wrapper = join(
			codexHome,
			`plugins/cache/fusengine-codex/react-expert/${version}/dist/hooks/check-skill-loaded.native.js`,
		);
		const pluginRoot = join(codexHome, `plugins/cache/fusengine-codex/react-expert/${version}`);
		const cacheFallback = join(pluginRoot, "..", "_shared", "scripts");
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
		expect(dest).toBe(join(codexHome, "fusengine-sys", "shared", "scripts"));
		expect(existsSync(join(dest, "dry-duplication.ts"))).toBe(true);
		expect(existsSync(join(dest, "modular-detection.ts"))).toBe(true);
		expect(existsSync(join(dest, "shadcn-patterns.ts"))).toBe(true);
		expect(existsSync(join(dest, "__pycache__", "ignored.pyc"))).toBe(false);
		expect(existsSync(cacheFallback)).toBe(false);
		expect(stderr).toBe("");
		expect(exitCode).toBe(0);
	});
});
