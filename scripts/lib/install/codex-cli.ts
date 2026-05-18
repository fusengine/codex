/**
 * codex-cli.ts — Wrappers around the `codex` CLI plugin/marketplace commands.
 * Reference: developers.openai.com/codex/cli/reference (PR #21396).
 *   codex plugin marketplace add <path|repo>
 *   codex plugin add <NAME>@<MARKETPLACE>
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function hasCodexCli(): Promise<boolean> {
	try {
		const proc = Bun.spawnSync(["codex", "--version"], { stderr: "pipe", stdout: "pipe" });
		return proc.exitCode === 0;
	} catch {
		return false;
	}
}

/**
 * Detect whether the installed Codex CLI supports `codex plugin add`.
 * Introduced via PR #21396 (merged 2026-05-06). We probe the subcommand
 * directly via `--help` — exit 0 means the subcommand exists.
 */
export async function supportsPluginAdd(): Promise<boolean> {
	const proc = Bun.spawnSync(["codex", "plugin", "add", "--help"], {
		stderr: "pipe",
		stdout: "pipe",
	});
	const err = proc.stderr.toString();
	if (/unrecognized subcommand/i.test(err)) return false;
	return proc.exitCode === 0;
}

async function run(args: string[]): Promise<void> {
	const proc = Bun.spawnSync(["codex", ...args], { stderr: "pipe", stdout: "pipe" });
	if (proc.exitCode !== 0) {
		throw new Error(`codex ${args.join(" ")} failed: ${proc.stderr.toString().trim()}`);
	}
}

export async function addMarketplace(projectRoot: string): Promise<void> {
	await run(["plugin", "marketplace", "add", projectRoot]);
}

export async function addPlugin(name: string, marketplace: string): Promise<void> {
	await run(["plugin", "add", `${name}@${marketplace}`]);
}

export async function listPlugins(projectRoot: string): Promise<string[]> {
	const entries = await readdir(join(projectRoot, "plugins"), { withFileTypes: true });
	const out: string[] = [];
	for (const e of entries) {
		if (!e.isDirectory() || e.name.startsWith(".") || e.name === "_shared") continue;
		const manifest = Bun.file(join(projectRoot, "plugins", e.name, ".codex-plugin", "plugin.json"));
		if (await manifest.exists()) out.push(e.name);
	}
	return out;
}
