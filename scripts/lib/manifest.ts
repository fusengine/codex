import { join } from "node:path";
import type { CodexManifest, ConverterResult } from "./types";

interface ClaudeManifest {
	name?: string;
	version?: string;
	description?: string;
	author?: CodexManifest["author"];
	repository?: string;
	homepage?: string;
	license?: string;
	keywords?: string[];
}

function stripFuseName(name: string): string {
	return name.replace(/^fuse-/, "");
}

function buildInterface(): Record<string, unknown> {
	return {
		cli: true,
		ide: true,
	};
}

async function readJsonSafe<T>(path: string): Promise<T | null> {
	const file = Bun.file(path);
	if (!(await file.exists())) return null;
	try {
		return (await file.json()) as T;
	} catch {
		return null;
	}
}

export async function transformManifest(
	srcDir: string,
	destDir: string,
): Promise<ConverterResult> {
	const errors: string[] = [];
	const srcPath = join(srcDir, ".codex-plugin", "plugin.json");
	const source = await readJsonSafe<ClaudeManifest>(srcPath);
	if (!source) {
		errors.push(`missing source manifest at ${srcPath}`);
		return { converted: 0, errors };
	}

	const name = stripFuseName(source.name ?? "");
	if (!name) {
		errors.push("manifest has no name");
		return { converted: 0, errors };
	}

	const manifest: CodexManifest = {
		name,
		version: source.version ?? "0.0.0",
		description: source.description ?? "",
		author: source.author,
		repository: source.repository,
		homepage: source.homepage,
		license: source.license ?? "MIT",
		keywords: source.keywords ?? [],
		skills: "./skills/",
		mcpServers: "./.mcp.json",
		hooks: "./hooks/hooks.json",
		interface: buildInterface(),
	};

	const out = join(destDir, ".codex-plugin", "plugin.json");
	try {
		await Bun.write(out, JSON.stringify(manifest, null, 2) + "\n");
		return { converted: 1, errors };
	} catch (err) {
		errors.push(`write failed: ${(err as Error).message}`);
		return { converted: 0, errors };
	}
}
