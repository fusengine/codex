/**
 * harness-env-options.test.ts — a harness toggle key PRESENT with a value other than its
 * preset must count as "active" (pre-checked) and, if it stays checked, `configureHarnessEnv`
 * must preserve that custom value rather than clobbering it back to the preset. Unchecking
 * still deletes the key; checking a previously-absent key still applies the preset.
 */
import { test, expect } from "bun:test";
import { HARNESS_ENV_OPTIONS, configureHarnessEnv, getEnabledHarnessEnv } from "./harness-env-options";

test("a key present with a CUSTOM value (not equal to the preset) counts as active", () => {
	const env = { FUSE_MCP_TTL_SEC: "3600" };
	expect(getEnabledHarnessEnv(env)).toContain("FUSE_MCP_TTL_SEC");
});

test("a key present at exactly the preset value still counts as active", () => {
	const env = { RALPH_MODE: "1" };
	expect(getEnabledHarnessEnv(env)).toContain("RALPH_MODE");
});

test("an absent key does not count as active", () => {
	expect(getEnabledHarnessEnv({})).toEqual([]);
});

test("a custom value is PRESERVED when the key stays selected across a multiselect round-trip", () => {
	const env = { FUSE_MCP_TTL_SEC: "3600", RALPH_MODE: "1" };
	const enabled = getEnabledHarnessEnv(env);
	const next = configureHarnessEnv(env, enabled);
	expect(next.FUSE_MCP_TTL_SEC).toBe("3600"); // NOT reset to the 172800 preset
	expect(next.RALPH_MODE).toBe("1");
});

test("unchecking a previously-active key deletes it", () => {
	const env = { RALPH_MODE: "1" };
	const next = configureHarnessEnv(env, []);
	expect(next.RALPH_MODE).toBeUndefined();
});

test("checking a previously-absent key applies its preset value", () => {
	const preset = HARNESS_ENV_OPTIONS.find((o) => o.key === "RALPH_MODE");
	if (!preset) throw new Error("RALPH_MODE missing from HARNESS_ENV_OPTIONS");
	const next = configureHarnessEnv({}, ["RALPH_MODE"]);
	expect(next.RALPH_MODE).toBe(preset.value);
});

test("foreign (non-harness) keys are never touched by configureHarnessEnv", () => {
	const env = { OPENAI_API_KEY: "sk-test" };
	const next = configureHarnessEnv(env, []);
	expect(next.OPENAI_API_KEY).toBe("sk-test");
});
