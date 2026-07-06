/**
 * config-prompt.test.ts — dangerous sandbox/approval combo requires an extra
 * confirmation before any write; declining it aborts the whole config write.
 */
import { test, expect, mock, describe, afterEach } from "bun:test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const queues = { selects: [] as string[], confirms: [] as boolean[], confirmCalls: 0 };

mock.module("@clack/prompts", () => ({
	select: mock(async () => queues.selects.shift() ?? "__skip"),
	confirm: mock(async () => {
		queues.confirmCalls++;
		return queues.confirms.shift() ?? false;
	}),
	isCancel: mock((value: unknown) => value === undefined),
	log: { step: () => {}, warn: () => {}, info: () => {}, success: () => {} },
}));

afterEach(() => mock.restore());

const { promptCodexConfig } = await import("./config-prompt");

function tmpHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-config-"));
}

// select order consumed by promptCodexConfig: model, model_reasoning_effort,
// personality, approval_policy, sandbox_mode, then agents.max_threads.
describe("promptCodexConfig — dangerous combo guard", () => {
	test("danger-full-access + never, declined: nothing is written at all", async () => {
		const home = tmpHome();
		queues.selects = ["__skip", "__skip", "__skip", "never", "danger-full-access"];
		queues.confirms = [false];
		queues.confirmCalls = 0;
		await promptCodexConfig(home);
		expect(queues.confirmCalls).toBe(1);
		expect(await Bun.file(join(home, "config.toml")).exists()).toBe(false);
		rmSync(home, { recursive: true, force: true });
	});

	test("danger-full-access + never, confirmed: both values are written", async () => {
		const home = tmpHome();
		queues.selects = ["__skip", "__skip", "__skip", "never", "danger-full-access", "__skip"];
		queues.confirms = [true];
		queues.confirmCalls = 0;
		await promptCodexConfig(home);
		expect(queues.confirmCalls).toBe(1);
		const content = readFileSync(join(home, "config.toml"), "utf-8");
		expect(content).toMatch(/approval_policy = "never"/);
		expect(content).toMatch(/sandbox_mode = "danger-full-access"/);
		rmSync(home, { recursive: true, force: true });
	});

	test("a safe combo writes straight through, no extra confirm needed", async () => {
		const home = tmpHome();
		queues.selects = ["__skip", "__skip", "__skip", "never", "workspace-write", "__skip"];
		queues.confirms = [];
		queues.confirmCalls = 0;
		await promptCodexConfig(home);
		expect(queues.confirmCalls).toBe(0);
		const content = readFileSync(join(home, "config.toml"), "utf-8");
		expect(content).toMatch(/sandbox_mode = "workspace-write"/);
		rmSync(home, { recursive: true, force: true });
	});
});
