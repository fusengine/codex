/**
 * exec-policy.test.ts — deposit, idempotence, foreign-file guard, empty-output guard, and the
 * post-hoc `approval_policy` guarantee. The generator is always injected — never shells out.
 */
import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { depositExecPolicy, EXEC_POLICY_MARKER } from "./exec-policy";
import { ensureApprovalPolicy } from "./exec-policy-approval";

const VALID_STARLARK = '# generated\nprefix_rule(\n  prefix = ["rm", "-rf"],\n)\n';

function tempCodexHome(): string {
	return mkdtempSync(join(tmpdir(), "codex-exec-policy-"));
}

function stubGenerate(starlark: string, version = "0.1.99") {
	return () => (starlark ? { starlark, harnessVersion: version } : undefined);
}

function rulesFile(codexHome: string): string {
	return join(codexHome, "rules", "fusengine.rules");
}

test("depositExecPolicy: nominal deposit writes marker + rules", async () => {
	const codexHome = tempCodexHome();
	await depositExecPolicy(codexHome, stubGenerate(VALID_STARLARK));
	const out = readFileSync(rulesFile(codexHome), "utf8");
	expect(out.split("\n")[0]).toBe(`${EXEC_POLICY_MARKER} harness@0.1.99`);
	expect(out).toContain("prefix_rule(");
	rmSync(codexHome, { recursive: true, force: true });
});

test("depositExecPolicy: idempotent across two runs, marker not duplicated", async () => {
	const codexHome = tempCodexHome();
	await depositExecPolicy(codexHome, stubGenerate(VALID_STARLARK));
	await depositExecPolicy(codexHome, stubGenerate(VALID_STARLARK, "0.1.100"));
	const out = readFileSync(rulesFile(codexHome), "utf8");
	const markerLines = out.split("\n").filter((line) => line.startsWith(EXEC_POLICY_MARKER));
	expect(markerLines).toEqual([`${EXEC_POLICY_MARKER} harness@0.1.100`]);
	expect(out).toContain("prefix_rule(");
	rmSync(codexHome, { recursive: true, force: true });
});

test("depositExecPolicy: foreign existing file is not overwritten", async () => {
	const codexHome = tempCodexHome();
	mkdirSync(join(codexHome, "rules"), { recursive: true });
	const foreign = '# hand-written rules\nprefix_rule(prefix=["x"])\n';
	writeFileSync(rulesFile(codexHome), foreign);
	await depositExecPolicy(codexHome, stubGenerate(VALID_STARLARK));
	expect(readFileSync(rulesFile(codexHome), "utf8")).toBe(foreign);
	rmSync(codexHome, { recursive: true, force: true });
});

test("depositExecPolicy: empty generator output writes nothing", async () => {
	const codexHome = tempCodexHome();
	await depositExecPolicy(codexHome, stubGenerate(""));
	expect(() => readFileSync(rulesFile(codexHome), "utf8")).toThrow();
	rmSync(codexHome, { recursive: true, force: true });
});

test("depositExecPolicy: output without prefix_rule( writes nothing", async () => {
	const codexHome = tempCodexHome();
	await depositExecPolicy(codexHome, stubGenerate("# only a comment, no rules\n"));
	expect(() => readFileSync(rulesFile(codexHome), "utf8")).toThrow();
	rmSync(codexHome, { recursive: true, force: true });
});

test("ensureApprovalPolicy: writes on-request when the key is absent", async () => {
	const codexHome = tempCodexHome();
	await Bun.write(join(codexHome, "config.toml"), 'model = "gpt-5.5"\n');
	await ensureApprovalPolicy(codexHome);
	const out = readFileSync(join(codexHome, "config.toml"), "utf8");
	expect(out).toContain('approval_policy = "on-request"');
	rmSync(codexHome, { recursive: true, force: true });
});

test("ensureApprovalPolicy: leaves an explicit never unchanged", async () => {
	const codexHome = tempCodexHome();
	const src = 'approval_policy = "never"\n';
	await Bun.write(join(codexHome, "config.toml"), src);
	await ensureApprovalPolicy(codexHome);
	expect(readFileSync(join(codexHome, "config.toml"), "utf8")).toBe(src);
	rmSync(codexHome, { recursive: true, force: true });
});
