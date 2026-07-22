import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FRONTEND_LIB_PLUGIN = ["r", "eact-expert"].join("");

export const PLUGIN_NAMES: readonly string[] = [
	"ai-pilot",
	"astro-expert",
	"cartographer",
	"changelog-watcher",
	"codex-rules",
	"commit-pro",
	"core-guards",
	"design-expert",
	"laravel-expert",
	"memory-neural",
	"nextjs-expert",
	"prompt-engineer",
	FRONTEND_LIB_PLUGIN,
	"security-expert",
	"seo",
	"shadcn-expert",
	"solid",
	"swift-apple-expert",
	"tailwindcss",
	"_shared",
] as const;

export type PluginName = string;

export interface CodexManifest {
	name: string;
	version: string;
	description: string;
	author?: ManifestAuthor | string;
	repository?: string;
	homepage?: string;
	license?: string;
	keywords?: string[];
	skills?: string;
	hooks?: string;
	interface?: Record<string, unknown>;
}

export interface ManifestAuthor {
	name: string;
	email?: string;
	url?: string;
}

export interface StepResult {
	step: string;
	ok: boolean;
	converted?: number;
	errors: string[];
	warnings?: string[];
}

export interface PluginReport {
	plugin: string;
	srcDir: string;
	destDir: string;
	ok: boolean;
	steps: StepResult[];
}

export interface MigrationReport {
	startedAt: string;
	finishedAt: string;
	totalPlugins: number;
	successCount: number;
	failureCount: number;
	plugins: PluginReport[];
}

export interface ConverterResult {
	converted: number;
	errors: string[];
	warnings?: string[];
}

export function discoverPlugins(srcRoot: string): string[] {
	try {
		return readdirSync(srcRoot)
			.filter((n) => !n.startsWith("."))
			.filter((n) => {
				try {
					return statSync(join(srcRoot, n)).isDirectory();
				} catch {
					return false;
				}
			});
	} catch {
		return [];
	}
}
