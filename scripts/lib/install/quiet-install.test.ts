import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { materializeAgentFiles } from "./agent-materializer";
import { symlinkPluginFiles } from "./plugin-file-symlinks";

function tempRoot(): string {
	return mkdtempSync(join(tmpdir(), "codex-quiet-install-"));
}

/** Captures everything written to stdout/stderr during `fn`, restoring both afterwards. */
async function captureOutput(fn: () => Promise<void>): Promise<string> {
	let out = "";
	const origOut = process.stdout.write.bind(process.stdout);
	const origErr = process.stderr.write.bind(process.stderr);
	(process.stdout.write as unknown) = (chunk: unknown) => { out += String(chunk); return true; };
	(process.stderr.write as unknown) = (chunk: unknown) => { out += String(chunk); return true; };
	try {
		await fn();
	} finally {
		process.stdout.write = origOut;
		process.stderr.write = origErr;
	}
	return out;
}

test("materializeAgentFiles({ quiet: true }) produces strictly empty stdout/stderr, even on a collision", async () => {
	const root = tempRoot();
	const cache = join(root, "cache");
	const agents = join(root, "agents");
	mkdirSync(join(cache, "alpha", "agents"), { recursive: true });
	writeFileSync(join(cache, "alpha", "agents", "dup.toml"), 'name = "dup"\n');

	const output = await captureOutput(() =>
		materializeAgentFiles(
			[
				{ plugin: "alpha", file: "dup.toml", src: join(cache, "alpha", "agents", "dup.toml") },
				{ plugin: "beta", file: "dup.toml", src: join(cache, "alpha", "agents", "dup.toml") },
			],
			cache,
			agents,
			{ quiet: true },
		),
	);

	expect(output).toBe("");
	rmSync(root, { recursive: true, force: true });
});

test("symlinkPluginFiles({ quiet: true }) produces strictly empty stdout/stderr, even on a collision", async () => {
	const root = tempRoot();
	const src = join(root, "src.md");
	writeFileSync(src, "content");
	const destDir = join(root, "prompts");

	const output = await captureOutput(() =>
		symlinkPluginFiles(
			[
				{ plugin: "alpha", file: "cmd.md", src },
				{ plugin: "beta", file: "cmd.md", src },
			],
			destDir,
			"command",
			{ quiet: true },
		),
	);

	expect(output).toBe("");
	rmSync(root, { recursive: true, force: true });
});
