/**
 * toml-helpers.test.ts — regex-based TOML upsert helpers.
 */
import { test, expect } from "bun:test";
import { parse } from "smol-toml";
import { hasKey, getRootKey, removeTableKey, setRootKey, setTableKey } from "./toml-helpers";

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

test("setTableKey: creates a missing table", () => {
	expect(setTableKey('model = "gpt-5.5"\n', "features", "hooks", "true"))
		.toBe('model = "gpt-5.5"\n\n[features]\nhooks = true\n');
});

test("setTableKey: updates only the requested table", () => {
	const src = "[features]\nhooks = false\n[other]\nhooks = false\n";
	expect(setTableKey(src, "features", "hooks", "true")).toBe("[features]\nhooks = true\n[other]\nhooks = false\n");
});

test("removeTableKey: removes only the requested table key", () => {
	const src = "[agents]\nmax_threads = 6\nmax_depth = 2\n[other]\nmax_threads = 8\n";
	expect(removeTableKey(src, "agents", "max_threads")).toBe("[agents]\nmax_depth = 2\n[other]\nmax_threads = 8\n");
});

test("setTableKey: recognizes a table header with a trailing comment", () => {
	const next = setTableKey("[features] # keep\nhooks = false\n", "features", "hooks", "true");
	expect(next).toBe("[features] # keep\nhooks = true\n");
	expect(parse(next)).toEqual({ features: { hooks: true } });
});

test("removeTableKey: stops at an indented sibling table", () => {
	const src = "[features]\nhooks = true\n  [other]\nplugin_hooks = true\n";
	expect(removeTableKey(src, "features", "plugin_hooks")).toBe(src);
	expect(parse(src)).toEqual({ features: { hooks: true }, other: { plugin_hooks: true } });
});
