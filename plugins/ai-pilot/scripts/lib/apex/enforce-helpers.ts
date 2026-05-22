/**
 * Helpers for enforce-apex-phases: framework detection and skill source mapping.
 * Extracted to keep the main hook file under 100 lines.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { RouteResult } from "../interfaces/ref-router.interface";

const HOME = process.env.HOME ?? "";
const PLUGINS_DIR = `${process.env.CODEX_HOME ?? `${HOME}/.codex`}/plugins/cache/fusengine-codex`;

function findSourcePluginsDir(start: string): string | undefined {
  let dir = start;
  while (dir !== dirname(dir)) {
    const pluginsDir = join(dir, "plugins");
    if (existsSync(join(pluginsDir, "ai-pilot", "scripts"))) return pluginsDir;
    dir = dirname(dir);
  }
  return undefined;
}

function findInstalledPluginRoot(pluginName: string): string | undefined {
  const pluginDir = join(PLUGINS_DIR, pluginName);
  if (!existsSync(pluginDir)) return undefined;
  const versions = readdirSync(pluginDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(pluginDir, entry.name, "skills")))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const latest = versions.at(-1);
  return latest ? join(pluginDir, latest) : undefined;
}

function findPluginRoot(pluginName: string): string | undefined {
  const sourcePlugins = findSourcePluginsDir(dirname(import.meta.path));
  if (sourcePlugins && existsSync(join(sourcePlugins, pluginName, "skills"))) {
    return join(sourcePlugins, pluginName);
  }
  return findInstalledPluginRoot(pluginName);
}

function skillPath(pluginName: string, skillName: string): string {
  const root = findPluginRoot(pluginName);
  if (root) return join(root, "skills", skillName, "SKILL.md");
  return join(PLUGINS_DIR, pluginName, "<version>", "skills", skillName, "SKILL.md");
}

function skillDir(pluginName: string, skillName: string): string {
  const root = findPluginRoot(pluginName);
  if (root) return join(root, "skills", skillName);
  return join(PLUGINS_DIR, pluginName, "<version>", "skills", skillName);
}

/**
 * Detect framework from file path extension and content patterns.
 * Aligned with core-guards/require-solid-read.py detection.
 * @param filePath - Absolute path to the file being written/edited
 * @param content - File content or new_string being written
 */
export function detectFramework(filePath: string, content: string): string {
  if (/\.(tsx?|jsx?|vue|svelte)$/.test(filePath) || /from ['"]react|useState|className=/.test(content)) {
    if (/(page|layout|loading|error|route)\.(ts|tsx)$/.test(filePath) || /use client|use server/.test(content)) {
      return "nextjs";
    }
    return "react";
  }
  if (/\.swift$/.test(filePath)) return "swift";
  if (/\.php$/.test(filePath)) return "laravel";
  if (/\.java$/.test(filePath)) return "java";
  if (/\.go$/.test(filePath)) return "go";
  if (/\.rb$/.test(filePath)) return "ruby";
  if (/\.rs$/.test(filePath)) return "rust";
  if (/\.css$/.test(filePath) || /@tailwind|@apply/.test(content)) return "tailwind";
  return "generic";
}

/**
 * Map framework to its SKILL.md documentation source path.
 * @param framework - Detected framework identifier
 */
export function getSkillSource(framework: string): string {
  const map: Record<string, string> = {
    react: skillPath("react-expert", "react-19"),
    nextjs: skillPath("nextjs-expert", "nextjs-16"),
    swift: skillPath("swift-apple-expert", "swiftui-core"),
    laravel: skillPath("laravel-expert", "laravel-eloquent"),
    tailwind: skillPath("tailwindcss", "tailwindcss-v4"),
    generic: skillPath("solid", "solid-generic"),
    java: skillPath("solid", "solid-java"),
    go: skillPath("solid", "solid-go"),
    ruby: skillPath("solid", "solid-ruby"),
    rust: skillPath("solid", "solid-rust"),
  };
  return map[framework] ?? "mcp__context7__query-docs";
}

/**
 * Map framework to its SOLID skill directory path.
 * @param framework - Detected framework identifier
 */
export function getSkillDir(framework: string): string {
  const map: Record<string, string> = {
    react: skillDir("react-expert", "solid-react"),
    nextjs: skillDir("nextjs-expert", "solid-nextjs"),
    swift: skillDir("swift-apple-expert", "solid-swift"),
    laravel: skillDir("laravel-expert", "solid-php"),
    generic: skillDir("solid", "solid-generic"),
    java: skillDir("solid", "solid-java"),
    go: skillDir("solid", "solid-go"),
    ruby: skillDir("solid", "solid-ruby"),
    rust: skillDir("solid", "solid-rust"),
  };
  return map[framework] ?? skillDir("solid", "solid-generic");
}

/**
 * Format deny message with specific routed references.
 * @param framework - Detected framework
 * @param filePath - File being edited
 * @param result - Routing result with scored references
 */
export function formatRoutedDeny(framework: string, filePath: string, result: RouteResult): string {
  const lines: string[] = [`APEX: Read specific SOLID references (expires every 2min) for ${framework}.`, `Editing: ${filePath}`, "Required:"];
  for (const [i, r] of result.required.entries()) lines.push(`  ${i + 1}. ${r.meta.filePath}`);
  if (result.optional.length) {
    lines.push("Optional:");
    for (const [i, r] of result.optional.entries()) lines.push(`  ${result.required.length + i + 1}. ${r.meta.filePath}`);
  }
  lines.push(`Full skill: ${result.skillPath}`);
  return lines.join("\n");
}
