/**
 * project-indicators.native.ts — native TS port of
 * _legacy_py/lib/project_indicators.py. Marker files that identify a real
 * project + directory names to exclude from the project map. Data-only; inlined
 * into generate_project_map. Sets are byte-identical to the Python.
 */

/** Files whose presence marks a directory as a real project. */
export const PROJECT_INDICATORS = new Set<string>([
  "package.json", "deno.json", "bun.lockb", "bun.lock", "tsconfig.json",
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "pnpm-workspace.yaml",
  "composer.json", "artisan",
  "Cargo.toml", "rust-toolchain.toml",
  "go.mod",
  "pyproject.toml", "setup.py", "setup.cfg", "Pipfile",
  "requirements.txt", "environment.yml",
  "Gemfile",
  "Package.swift", "Podfile",
  "pubspec.yaml",
  "pom.xml", "build.gradle", "build.gradle.kts",
  "settings.gradle", "build.sbt",
  "Makefile", "CMakeLists.txt", "meson.build", "configure.ac",
  "Directory.Build.props", "global.json",
  "mix.exs", "rebar.config",
  "project.clj", "deps.edn",
  "stack.yaml", "cabal.project",
  "dune-project",
  "build.zig",
  "gleam.toml",
  "v.mod",
  "Project.toml",
  "DESCRIPTION",
  "cpanfile", "Makefile.PL",
  ".luacheckrc",
  "astro.config.mjs", "next.config.js", "next.config.mjs",
  "nuxt.config.ts", "vite.config.ts", "next.config.ts", "angular.json",
  "svelte.config.js", "svelte.config.ts",
  "main.tf", "ansible.cfg", "pulumi.yaml",
  "cdk.json", "Chart.yaml",
  "wrangler.toml", "fly.toml",
  "turbo.json", "nx.json",
  "BUILD", "WORKSPACE", "Justfile", "Taskfile.yml",
  "docker-compose.yml", "docker-compose.yaml",
  "compose.yml", "compose.yaml", "Dockerfile",
  ".git",
]);

/** Directory names excluded from the generated project tree. */
export const EXCLUDE_DIRS = new Set<string>([
  "node_modules", ".git", ".next", ".nuxt", "dist", "build",
  ".output", "vendor", "__pycache__", ".venv", "venv",
  ".cartographer", ".codex", ".ruff_cache", ".DS_Store",
  "coverage", ".turbo", ".vercel", ".netlify",
  "Pods", "DerivedData", ".build", ".swiftpm",
]);
