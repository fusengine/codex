/**
 * shell-detect.ts — Detect current shell + check whether codex-env auto-loader
 * is already installed. Read-only utilities.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

export type Shell = "fish" | "zsh" | "bash" | "pwsh" | "unknown";

const MARKER = "# fusengine-codex env loader";

export function detectShell(): Shell {
	if (platform() === "win32") return "pwsh";
	const sh = (process.env.SHELL || "").toLowerCase();
	if (sh.endsWith("/fish")) return "fish";
	if (sh.endsWith("/zsh")) return "zsh";
	if (sh.endsWith("/bash")) return "bash";
	return "unknown";
}

export function fishConfPath(): string {
	return join(homedir(), ".config", "fish", "conf.d", "codex-env.fish");
}

export function posixRcPath(shell: "zsh" | "bash"): string {
	return join(homedir(), shell === "zsh" ? ".zshrc" : ".bashrc");
}

export function isShellConfigured(shell: Shell): boolean {
	if (shell === "fish") return existsSync(fishConfPath());
	if (shell === "zsh" || shell === "bash") {
		const rc = posixRcPath(shell);
		return existsSync(rc) && readFileSync(rc, "utf8").includes(MARKER);
	}
	return false;
}

export { MARKER };
