import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { HookConfig } from "./hook-process.types";

const plugins = join(import.meta.dir, "..", "..", "..", "..");

function load(plugin: string): HookConfig {
  const path = join(plugins, plugin, "hooks", "hooks.json");
  return JSON.parse(readFileSync(path, "utf-8")) as HookConfig;
}

function commands(config: HookConfig, event: string): string[] {
  return (config.hooks[event] ?? []).flatMap((entry) => entry.hooks.map((hook) => hook.command));
}

test("core validators use native Codex lifecycle events", () => {
  const config = load("core-guards");
  const coreRoute =
    'bun "${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs" hook codex core';
  expect(commands(config, "SubagentStop")).toStrictEqual([coreRoute]);
  expect(commands(config, "Stop")).toStrictEqual([coreRoute]);
});

test("sound commands are absent", () => {
  const config = load("core-guards");
  const all = Object.keys(config.hooks).flatMap((event) => commands(config, event));
  expect(all.some((command) => command.includes("sound/play.ts"))).toBe(false);
  expect(all.some((command) => command.includes("afplay"))).toBe(false);
});

test("removed orphan scripts have no live hook references", () => {
  const liveConfigs = [load("shadcn-expert"), load("changelog-watcher")];
  const serialized = JSON.stringify(liveConfigs);
  expect(serialized).not.toContain("detect-primitive-lib");
  expect(serialized).not.toContain("fetch-changelog");
});
