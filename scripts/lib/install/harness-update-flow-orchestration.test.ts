/**
 * harness-update-flow-orchestration.test.ts — covers the exports of
 * `harness-update-flow.ts` itself (`checkHarnessStatus`, `recoverFromSnapshot`),
 * which had no coverage before. Kept separate from `harness-update-flow.test.ts`
 * (which, despite its name, tests primitives re-exported from
 * `harness-update.ts`) to stay under the 200-line file ceiling.
 */
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { takeSnapshot } from "./harness-update";
import { checkHarnessStatus, recoverFromSnapshot } from "./harness-update-flow";

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { force: true, recursive: true })));

function tempRoot(): string {
	const root = mkdtempSync(join(tmpdir(), "harness-flow-orch-"));
	roots.push(root);
	return root;
}

function seedRepo(root: string, declaredSpec: string, installedVersion: string, auditedVersion: string): void {
	writeFileSync(join(root, "package.json"), `{\n\t"dependencies": {\n\t\t"@fusengine/harness": "${declaredSpec}"\n\t}\n}\n`);
	mkdirSync(join(root, "node_modules", "@fusengine", "harness"), { recursive: true });
	writeFileSync(join(root, "node_modules", "@fusengine", "harness", "package.json"), JSON.stringify({ version: installedVersion }));
	mkdirSync(join(root, "scripts", "lib"), { recursive: true });
	writeFileSync(join(root, "scripts", "lib", "harness-hook-policy.ts"), `export const HARNESS_VERSION = "${auditedVersion}";\n`);
}

describe("checkHarnessStatus", () => {
	test("reports installed/declared/audited/latest and upToDate=false on tripwire drift, no writes", () => {
		const root = tempRoot();
		seedRepo(root, "^0.1.91", "0.1.91", "0.1.90");
		const codexHome = tempRoot();

		const report = checkHarnessStatus(root, codexHome, () => "0.1.91\n");

		expect(report).toEqual({
			installed: "0.1.91",
			declared: "^0.1.91",
			audited: "0.1.90",
			latest: "0.1.91",
			codexHomeInstalled: "not installed",
			upToDate: false,
		});
	});

	test("upToDate=true when installed, audited, and declared (exact pin) all match latest", () => {
		const root = tempRoot();
		seedRepo(root, "0.1.91", "0.1.91", "0.1.91");
		const codexHome = tempRoot();

		expect(checkHarnessStatus(root, codexHome, () => "0.1.91\n").upToDate).toBe(true);
	});
});

describe("recoverFromSnapshot", () => {
	test("restores package.json and folds the frozen-lockfile reinstall exit code into the console.error message", () => {
		const root = tempRoot();
		writeFileSync(join(root, "package.json"), '{"name":"scratch"}\n');
		const snapshot = takeSnapshot(root);
		writeFileSync(join(root, "package.json"), '{"name":"mutated-mid-update"}\n');

		const errorSpy = spyOn(console, "error").mockImplementation(() => {});
		const exitCode = recoverFromSnapshot(root, snapshot, "test reason");

		// Assert on the spy BEFORE `mockRestore()` — Bun's `mockRestore()` also
		// clears recorded calls, unlike plain `mockReset`.
		expect(exitCode).toBe(1);
		expect(readFileSync(join(root, "package.json"), "utf8")).toBe('{"name":"scratch"}\n');
		expect(errorSpy).toHaveBeenCalledTimes(1);
		const message = String(errorSpy.mock.calls[0]?.[0]);
		errorSpy.mockRestore();

		expect(message).toContain("harness: update aborted — test reason");
		expect(message).toMatch(/recovery bun install exit=\d+/);
	});
});
