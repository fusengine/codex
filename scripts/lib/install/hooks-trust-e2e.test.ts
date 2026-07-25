/**
 * hooks-trust-e2e.test.ts — decisive proof against the REAL `codex` binary that hookKey()/
 * pluginHookKeySource() build the exact persisted key codex-rs's discovery engine looks up
 * (hooks/src/lib.rs `hook_key`). `test.skip`, not wired into the default fast suite: a real run
 * needs network + ~30s (retry/backoff to a 401 once no auth.json exists in the throwaway
 * CODEX_HOME) and was already executed manually with the exact steps below — see the report.
 *
 * Why this proves the key format and not the trusted_hash/bypass gate: this sandbox's `codex`
 * has a system-managed config layer (outside CODEX_HOME, unremovable here) that forces
 * `bypass_hook_trust = true` unconditionally — proven by writing an explicit
 * `bypass_hook_trust = false` into a throwaway CODEX_HOME and still seeing the CLI print
 * "`--dangerously-bypass-hook-trust` is enabled" without ever passing that flag. That makes the
 * trust/hash gate unobservable via execution here, but `enabled` in `[hooks.state.*]` is
 * checked independently of bypass (hooks/src/engine/discovery.rs `hook_enabled`), so writing
 * `enabled = false` under our own computed key and asserting the hook did NOT run is still a
 * valid, bypass-independent proof that codex parsed our `[hooks.state."<key>"]` table and
 * matched OUR key string against its own internal one.
 *
 * Manually executed once during implementation, result: marker_a present (control hook ran),
 * marker_b absent (hook gated by our computed key, `enabled = false`, was correctly suppressed).
 *
 * To re-run manually on a machine without a forced bypass layer:
 *   1. mktemp -d, seed `<tmp>/plugins/cache/fusengine-codex/<plugin>/<version>/hooks/hooks.json`
 *      with a two-handler SessionStart group (see `seedE2ePlugin` below for the exact fixture).
 *   2. Write `<tmp>/config.toml` with `[marketplaces.fusengine-codex]`,
 *      `[plugins."<plugin>@fusengine-codex"] enabled = true`, and
 *      `[hooks.state."<hookKey(...)>"] enabled = false` for the second handler.
 *   3. `env CODEX_HOME=<tmp> codex exec --skip-git-repo-check "reply ok" < /dev/null`
 *   4. Assert marker_a exists, marker_b does not.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";
import { hookKey, pluginHookKeySource } from "./hook-key";

const MARKETPLACE = "fusengine-codex";
const PLUGIN = "e2eplug";

function seedE2ePlugin(codexHome: string, markerA: string, markerB: string): string {
	const root = join(codexHome, "plugins", "cache", MARKETPLACE, PLUGIN, "0.0.1");
	mkdirSync(join(root, ".codex-plugin"), { recursive: true });
	mkdirSync(join(root, "hooks"), { recursive: true });
	writeFileSync(join(root, ".codex-plugin", "plugin.json"), JSON.stringify({ name: PLUGIN, version: "0.0.1", description: "e2e probe", author: { name: "fusengine" }, license: "MIT" }));
	writeFileSync(
		join(root, "hooks", "hooks.json"),
		JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: "command", command: `touch ${markerA}` }, { type: "command", command: `touch ${markerB}` }] }] } }),
	);
	const keySource = pluginHookKeySource(`${PLUGIN}@${MARKETPLACE}`, "hooks/hooks.json");
	return hookKey(keySource, "SessionStart", 0, 1);
}

test.skip("real codex binary: enabled=false under our computed key suppresses only that handler", async () => {
	const codexHome = mkdtempSync(join(tmpdir(), "codex-hooks-trust-e2e-"));
	const markerA = join(codexHome, "marker_a");
	const markerB = join(codexHome, "marker_b");
	const keyB = seedE2ePlugin(codexHome, markerA, markerB);

	writeFileSync(
		join(codexHome, "config.toml"),
		[
			`[marketplaces.${MARKETPLACE}]`,
			`source_type = "local"`,
			`source = "${process.cwd()}"`,
			"",
			`[plugins."${PLUGIN}@${MARKETPLACE}"]`,
			"enabled = true",
			"",
			`[hooks.state."${keyB}"]`,
			"enabled = false",
			"",
		].join("\n"),
	);

	Bun.spawnSync(["codex", "exec", "--skip-git-repo-check", "reply ok"], {
		env: { ...process.env, CODEX_HOME: codexHome },
		stdin: "ignore",
		stdout: "ignore",
		stderr: "ignore",
	});

	expect(await Bun.file(markerA).exists()).toBe(true);
	expect(await Bun.file(markerB).exists()).toBe(false);
	rmSync(codexHome, { recursive: true, force: true });
});
