import { expect, test } from "bun:test";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listPluginFiles } from "./plugin-file-discovery";
import { symlinkPluginFiles } from "./plugin-file-symlinks";

function tempRoot(): string {
	return mkdtempSync(join(tmpdir(), "codex-plugin-links-"));
}

test("listPluginFiles reads direct plugins and latest versioned cache entries", async () => {
	const root = tempRoot();
	mkdirSync(join(root, "alpha", "commands"), { recursive: true });
	mkdirSync(join(root, "beta", "1.0.0", "commands"), { recursive: true });
	mkdirSync(join(root, "beta", "1.2.0", "commands"), { recursive: true });
	writeFileSync(join(root, "alpha", "commands", "foo.md"), "foo");
	writeFileSync(join(root, "beta", "1.0.0", "commands", "old.md"), "old");
	writeFileSync(join(root, "beta", "1.2.0", "commands", "bar.md"), "bar");

	const files = await listPluginFiles(root, "commands", ".md");

	expect(files.map((file) => `${file.plugin}/${file.file}`).sort()).toEqual(["alpha/foo.md", "beta/bar.md"]);
	rmSync(root, { recursive: true, force: true });
});

test("symlinkPluginFiles preserves user files and replaces managed plugin links", async () => {
	const root = tempRoot();
	const prompts = join(root, "prompts");
	const pluginCommands = join(root, "plugins", "alpha", "commands");
	const oldPluginCommands = join(root, "plugins", "old", "commands");
	const externalCommands = join(root, "external");
	mkdirSync(prompts, { recursive: true });
	mkdirSync(pluginCommands, { recursive: true });
	mkdirSync(oldPluginCommands, { recursive: true });
	mkdirSync(externalCommands, { recursive: true });

	const userPrompt = join(prompts, "memory.md");
	const newWatch = join(pluginCommands, "watch.md");
	const oldWatch = join(oldPluginCommands, "watch.md");
	const newScan = join(pluginCommands, "scan.md");
	const externalScan = join(externalCommands, "scan.md");
	writeFileSync(userPrompt, "user prompt");
	writeFileSync(newWatch, "new watch");
	writeFileSync(oldWatch, "old watch");
	writeFileSync(newScan, "new scan");
	writeFileSync(externalScan, "external scan");
	symlinkSync(oldWatch, join(prompts, "watch.md"));
	symlinkSync(externalScan, join(prompts, "scan.md"));

	await symlinkPluginFiles([
		{ plugin: "alpha", file: "memory.md", src: join(pluginCommands, "memory.md") },
		{ plugin: "alpha", file: "watch.md", src: newWatch },
		{ plugin: "alpha", file: "scan.md", src: newScan },
	], prompts, "command");

	expect(lstatSync(userPrompt).isSymbolicLink()).toBe(false);
	expect(readFileSync(userPrompt, "utf8")).toBe("user prompt");
	expect(readlinkSync(join(prompts, "watch.md"))).toBe(newWatch);
	expect(readlinkSync(join(prompts, "scan.md"))).toBe(externalScan);
	rmSync(root, { recursive: true, force: true });
});
