/**
 * exec-policy-generator.ts — invokes the locally installed `@fusengine/harness` binary to
 * generate Codex execpolicy Starlark rules, and resolves the exact installed harness version.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Raw Starlark output from `harness codex-rules`, paired with the harness version that produced it. */
export interface GeneratedRules {
	starlark: string;
	harnessVersion: string;
}

/**
 * Reads the RESOLVED harness version from `node_modules/@fusengine/harness/package.json`
 * under `codexHome`. Deliberately not the semver range pinned in the repo manifest (e.g.
 * `^0.1.79`, see `harnessRange` in runtime-deps.ts) nor the hardcoded `HARNESS_VERSION` in
 * harness-hook-policy.ts (a manually-tracked pin for a different concern, hook-wiring
 * assertions) — only the installed package's own `package.json` reflects what `bun install`
 * actually resolved this run.
 */
function resolveHarnessVersion(codexHome: string): string | undefined {
	const pkgPath = join(codexHome, "node_modules", "@fusengine", "harness", "package.json");
	if (!existsSync(pkgPath)) return undefined;
	try {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
		return pkg.version;
	} catch {
		return undefined;
	}
}

/**
 * Runs `bun <harness bin.mjs> codex-rules` and captures stdout as Starlark text. Same
 * invocation shape as `HARNESS_BIN` in harness-hook-policy.ts (`bun "<bin.mjs>" <subcommand>`).
 * Never throws: a missing binary, a missing/unreadable version, a spawn error, or a non-zero
 * exit all resolve to `undefined` so the caller can warn and continue the install.
 */
export function generateExecPolicyRules(codexHome: string): GeneratedRules | undefined {
	const harnessVersion = resolveHarnessVersion(codexHome);
	if (!harnessVersion) return undefined;
	const bin = join(codexHome, "node_modules", "@fusengine", "harness", "dist", "cli", "bin.mjs");
	if (!existsSync(bin)) return undefined;
	try {
		const result = Bun.spawnSync(["bun", bin, "codex-rules"], { stdout: "pipe", stderr: "pipe" });
		if (!result.success) return undefined;
		const starlark = result.stdout.toString("utf8");
		return starlark.length > 0 ? { starlark, harnessVersion } : undefined;
	} catch {
		return undefined;
	}
}
