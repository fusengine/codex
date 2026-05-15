/**
 * shell-install.ts — Install codex-env auto-loader into the user's shell.
 * Generates ~/.config/fish/conf.d/codex-env.fish for fish, or appends a
 * sourcing snippet to ~/.zshrc / ~/.bashrc / PowerShell profile.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as p from "@clack/prompts";
import { MARKER, detectShell, fishConfPath, isShellConfigured, posixRcPath, type Shell } from "./shell-detect";

const TEMPLATE_DIR = new URL("../../env-shell/", import.meta.url).pathname;

function loadTemplate(name: string): string {
	return readFileSync(join(TEMPLATE_DIR, name), "utf8");
}

function installFish(): string {
	const dest = fishConfPath();
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, loadTemplate("codex-env.fish"));
	return dest;
}

function installPosix(shell: "zsh" | "bash"): string {
	const rc = posixRcPath(shell);
	const snippet = `\n${MARKER}\n[ -f "$HOME/.codex/.env" ] && . "$HOME/.codex/.env"\n`;
	const current = existsSync(rc) ? readFileSync(rc, "utf8") : "";
	if (!current.includes(MARKER)) writeFileSync(rc, current + snippet);
	return rc;
}

function powershellProfile(): string {
	return process.env.PROFILE || join(process.env.USERPROFILE || "", "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1");
}

function installPwsh(): string {
	const dest = powershellProfile();
	mkdirSync(dirname(dest), { recursive: true });
	const snippet = `\n${MARKER}\n${loadTemplate("codex-env.ps1")}\n`;
	const current = existsSync(dest) ? readFileSync(dest, "utf8") : "";
	if (!current.includes(MARKER)) writeFileSync(dest, current + snippet);
	return dest;
}

export async function configureShellAutoLoad(): Promise<void> {
	const shell: Shell = detectShell();
	if (shell === "unknown") {
		p.log.warn("Could not detect shell — source ~/.codex/.env manually");
		return;
	}
	if (isShellConfigured(shell)) {
		p.log.info(`${shell}: codex-env loader already installed`);
		return;
	}
	const ok = await p.confirm({
		message: `Install ${shell} auto-loader for ~/.codex/.env?`,
		initialValue: true,
	});
	if (p.isCancel(ok) || !ok) return;
	const path = shell === "fish" ? installFish() : shell === "pwsh" ? installPwsh() : installPosix(shell);
	p.log.success(`${shell} loader installed → ${path}`);
}
