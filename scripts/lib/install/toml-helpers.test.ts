/**
 * toml-helpers.test.ts — regex-based TOML upsert helpers.
 */
import { test, expect } from "bun:test";
import { hasKey, getRootKey, setRootKey, hasAgentsSection, setAgentsThreads } from "./toml-helpers";

test("hasKey: detects a present root key, ignores absent one", () => {
	expect(hasKey('model = "gpt-5.5"\n', "model")).toBe(true);
	expect(hasKey('model = "gpt-5.5"\n', "sandbox_mode")).toBe(false);
});

test("getRootKey: strips quotes from a quoted value", () => {
	expect(getRootKey('approval_policy = "never"\n', "approval_policy")).toBe("never");
});

test("getRootKey: reads an unquoted value", () => {
	expect(getRootKey("bypass_hook_trust = true\n", "bypass_hook_trust")).toBe("true");
});

test("getRootKey: strips a trailing inline comment", () => {
	expect(getRootKey('sandbox_mode = "danger-full-access" # from a prior run\n', "sandbox_mode")).toBe("danger-full-access");
});

test("getRootKey: undefined when the key is absent", () => {
	expect(getRootKey('model = "gpt-5.5"\n', "sandbox_mode")).toBeUndefined();
});

test("setRootKey: inserts a new key when absent", () => {
	const next = setRootKey("", "model", "gpt-5.5");
	expect(next).toBe('model = "gpt-5.5"\n');
});

test("setRootKey: replaces an existing value in place", () => {
	const next = setRootKey('model = "gpt-5.4"\nother = 1\n', "model", "gpt-5.5");
	expect(next).toBe('model = "gpt-5.5"\nother = 1\n');
});

test("setRootKey: preserves a trailing inline comment on update", () => {
	const src = 'sandbox_mode = "read-only" # locked down for CI\n';
	const next = setRootKey(src, "sandbox_mode", "workspace-write");
	expect(next).toBe('sandbox_mode = "workspace-write" # locked down for CI\n');
});

test("setRootKey: unquoted value has no comment to preserve", () => {
	const next = setRootKey("max_threads = 6\n", "max_threads", "12", false);
	expect(next).toBe("max_threads = 12\n");
});

test("hasAgentsSection: detects the [agents] table", () => {
	expect(hasAgentsSection("[agents]\nmax_threads = 6\n")).toBe(true);
	expect(hasAgentsSection("model = \"gpt-5.5\"\n")).toBe(false);
});

test("setAgentsThreads: creates the table when absent", () => {
	expect(setAgentsThreads("model = \"gpt-5.5\"\n", "12")).toBe('model = "gpt-5.5"\n\n[agents]\nmax_threads = 12\n');
});

test("setAgentsThreads: upserts within an existing table without touching other sections", () => {
	const src = "[agents]\nmax_threads = 6\n[other]\nkey = 1\n";
	expect(setAgentsThreads(src, "16")).toBe("[agents]\nmax_threads = 16\n[other]\nkey = 1\n");
});
