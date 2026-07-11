import { expect, mock, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "smol-toml";

mock.module("@clack/prompts", () => ({
	confirm: mock(async () => false),
	isCancel: mock(() => false),
}));

const { ensureFeaturesEnabled } = await import("./features");

test("keeps an existing V2 concurrency limit and is idempotent", async () => {
	const home = mkdtempSync(join(tmpdir(), "codex-features-concurrency-"));
	try {
		const path = join(home, "config.toml");
		await Bun.write(path, "[features.multi_agent_v2]\nenabled = true\nmax_concurrent_threads_per_session = 9\n");
		await ensureFeaturesEnabled(home);
		const first = readFileSync(path, "utf-8");
		await ensureFeaturesEnabled(home);
		const second = readFileSync(path, "utf-8");

		const parsed = parse(second) as Record<string, Record<string, unknown>>;
		expect(parsed.features?.multi_agent_v2).toMatchObject({
			max_concurrent_threads_per_session: 9,
			tool_namespace: "fusengine_agents",
			hide_spawn_agent_metadata: false,
		});
		expect(second).toBe(first);
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});

test("overrides the existing namespace and hidden metadata while preserving siblings", async () => {
	const home = mkdtempSync(join(tmpdir(), "codex-features-metadata-"));
	try {
		const path = join(home, "config.toml");
		await Bun.write(path, [
			"[features.multi_agent_v2]",
			"enabled = true",
			'tool_namespace = "collaboration"',
			"hide_spawn_agent_metadata = true",
			"default_wait_timeout_ms = 45000",
			"",
		].join("\n"));
		await ensureFeaturesEnabled(home);

		const parsed = parse(readFileSync(path, "utf-8")) as Record<string, Record<string, unknown>>;
		expect(parsed.features?.multi_agent_v2).toMatchObject({
			default_wait_timeout_ms: 45000,
			tool_namespace: "fusengine_agents",
			hide_spawn_agent_metadata: false,
		});
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});
