#!/usr/bin/env bun
/**
 * Portable optional sound hook. Plays only when afplay exists.
 */
import { existsSync } from "node:fs";

const soundPath = process.argv[2] ?? "";

if (process.platform !== "darwin" || !soundPath || !existsSync(soundPath)) process.exit(0);

try {
	const proc = Bun.spawnSync(["afplay", soundPath], { stderr: "pipe", stdout: "pipe" });
	process.exit(proc.exitCode ?? 0);
} catch {
	process.exit(0);
}
