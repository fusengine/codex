import { expect, mock, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "smol-toml";

const state = { choices: [] as string[], calls: [] as unknown[] };

mock.module("@clack/prompts", () => ({
	select: mock(async (input: unknown) => {
		state.calls.push(input);
		return state.choices.shift() ?? "__skip";
	}),
	confirm: mock(async () => false),
	isCancel: mock(() => false),
	log: { step: () => {}, warn: () => {}, info: () => {}, success: () => {} },
}));

const { promptCodexConfig } = await import("./config-prompt");
const models = [{
	model: "dynamic-model", displayName: "Dynamic Model", description: "", hidden: false, isDefault: true,
	supportedReasoningEfforts: [{ reasoningEffort: "medium", description: "Balanced" }],
}];

test("prompts for and overrides MultiAgentV2 concurrency", async () => {
	const home = mkdtempSync(join(tmpdir(), "codex-config-concurrency-"));
	try {
		await Bun.write(join(home, "config.toml"), "[features.multi_agent_v2]\nmax_concurrent_threads_per_session = 9\n");
		state.choices = ["__skip", "__skip", "__skip", "__skip", "__skip", "8"];
		state.calls = [];
		await promptCodexConfig(home, async () => models);

		const parsed = parse(readFileSync(join(home, "config.toml"), "utf-8")) as Record<string, Record<string, unknown>>;
		expect(parsed.features?.multi_agent_v2).toMatchObject({ max_concurrent_threads_per_session: 8 });
		const prompt = state.calls.at(5) as { message: string; options: Array<{ value: string; hint?: string }> };
		expect(prompt.message).toBe("features.multi_agent_v2.max_concurrent_threads_per_session (set — pick to override or skip)");
		expect(prompt.options.slice(0, 5).map(({ value }) => value)).toEqual(["4", "6", "8", "12", "16"]);
		expect(prompt.options[0]?.hint).toBe("Codex default · root + 3 sub-agents");
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});

test("keeps an arbitrary V2 concurrency value when skipped", async () => {
	const home = mkdtempSync(join(tmpdir(), "codex-config-concurrency-skip-"));
	try {
		const path = join(home, "config.toml");
		await Bun.write(path, "[features.multi_agent_v2]\nmax_concurrent_threads_per_session = 7\n");
		state.choices = Array(6).fill("__skip");
		state.calls = [];
		await promptCodexConfig(home, async () => models);

		const parsed = parse(readFileSync(path, "utf-8")) as Record<string, Record<string, unknown>>;
		expect(parsed.features?.multi_agent_v2).toMatchObject({ max_concurrent_threads_per_session: 7 });
		expect(readFileSync(path, "utf-8")).not.toMatch(/agents\.max_threads/);
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});
