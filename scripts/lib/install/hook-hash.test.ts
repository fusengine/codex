/**
 * hook-hash.test.ts — the expected hash in the first test is computed independently (a literal
 * canonical JSON string hashed inline via node:crypto), not by re-running the function under
 * test — so it actually catches key-order/compactness/field-shape bugs, not just determinism.
 */
import { createHash } from "node:crypto";
import { expect, test } from "bun:test";
import { computeCommandHookHash, hookEventKeyLabel, hookKey, pluginHookKeySource, sha256HashOfCanonicalValue } from "./hook-hash";

function sha256(json: string): string {
	return `sha256:${createHash("sha256").update(json, "utf8").digest("hex")}`;
}

test("computeCommandHookHash matches an independently-built canonical JSON string", () => {
	const expectedJson = '{"event_name":"pre_tool_use","hooks":[{"async":false,"command":"echo hi","timeout":600,"type":"command"}],"matcher":"Bash"}';
	const hash = computeCommandHookHash({ eventName: "PreToolUse", matcher: "Bash", command: "echo hi" });
	expect(hash).toBe(sha256(expectedJson));
	expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
});

test("sha256HashOfCanonicalValue sorts object keys recursively regardless of insertion order", () => {
	const a = { z: 1, a: { y: 2, b: 3 }, m: [{ z: 1, a: 2 }] };
	const b = { a: { b: 3, y: 2 }, m: [{ z: 1, a: 2 }], z: 1 };
	expect(sha256HashOfCanonicalValue(a)).toBe(sha256HashOfCanonicalValue(b));
});

test("sha256HashOfCanonicalValue never reorders array elements", () => {
	const forward = { list: [1, 2, 3] };
	const reversed = { list: [3, 2, 1] };
	expect(sha256HashOfCanonicalValue(forward)).not.toBe(sha256HashOfCanonicalValue(reversed));
});

test("changing the command changes the hash", () => {
	const a = computeCommandHookHash({ eventName: "PreToolUse", command: "echo one" });
	const b = computeCommandHookHash({ eventName: "PreToolUse", command: "echo two" });
	expect(a).not.toBe(b);
});

test("UserPromptSubmit and Stop force-drop the matcher even when one is supplied", () => {
	const withMatcher = computeCommandHookHash({ eventName: "UserPromptSubmit", matcher: "ignored", command: "echo hi" });
	const withoutMatcher = computeCommandHookHash({ eventName: "UserPromptSubmit", command: "echo hi" });
	expect(withMatcher).toBe(withoutMatcher);
});

test("SessionEnd timeout defaults to 1s and clamps at 3s", () => {
	const noTimeout = computeCommandHookHash({ eventName: "SessionEnd", command: "echo hi" });
	const oneSec = computeCommandHookHash({ eventName: "SessionEnd", command: "echo hi", timeoutSec: 1 });
	const overCap = computeCommandHookHash({ eventName: "SessionEnd", command: "echo hi", timeoutSec: 600 });
	const atCap = computeCommandHookHash({ eventName: "SessionEnd", command: "echo hi", timeoutSec: 3 });
	expect(noTimeout).toBe(oneSec);
	expect(overCap).toBe(atCap);
});

test("additionalContextLimit at the 2500 default is indistinguishable from omitted", () => {
	const omitted = computeCommandHookHash({ eventName: "PreToolUse", command: "echo hi" });
	const explicitDefault = computeCommandHookHash({ eventName: "PreToolUse", command: "echo hi", additionalContextLimit: 2_500 });
	const custom = computeCommandHookHash({ eventName: "PreToolUse", command: "echo hi", additionalContextLimit: 9_000 });
	expect(omitted).toBe(explicitDefault);
	expect(omitted).not.toBe(custom);
});

test("additionalContextLimit is ignored entirely for events that cannot emit it", () => {
	const withLimit = computeCommandHookHash({ eventName: "Stop", command: "echo hi", additionalContextLimit: 9_000 });
	const withoutLimit = computeCommandHookHash({ eventName: "Stop", command: "echo hi" });
	expect(withLimit).toBe(withoutLimit);
});

test("hookEventKeyLabel maps every known event and throws on an unknown one", () => {
	expect(hookEventKeyLabel("SubagentStart")).toBe("subagent_start");
	expect(hookEventKeyLabel("PermissionRequest")).toBe("permission_request");
	expect(() => hookEventKeyLabel("NotAnEvent")).toThrow();
});

test("hookKey and pluginHookKeySource match the documented reference format", () => {
	const keySource = pluginHookKeySource("demo@test", "hooks/hooks.json");
	expect(keySource).toBe("demo@test:hooks/hooks.json");
	expect(hookKey(keySource, "PreToolUse", 0, 0)).toBe("demo@test:hooks/hooks.json:pre_tool_use:0:0");
	expect(hookKey(keySource, "SessionStart", 0, 0)).toBe("demo@test:hooks/hooks.json:session_start:0:0");
});
