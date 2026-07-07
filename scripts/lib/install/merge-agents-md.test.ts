/**
 * merge-agents-md.test.ts — fenced-section merge + config.toml doc-size bump.
 */
import { test, expect } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRulesCorpus, mergeRulesSection, ensureProjectDocMaxBytes, mergeAgentsMd } from "./merge-agents-md";

test("mergeRulesSection: appends the fenced section when absent", () => {
	const next = mergeRulesSection("# My notes\n", "rule A");
	expect(next).toBe("# My notes\n\n<!-- fusengine:codex-rules:start -->\nrule A\n<!-- fusengine:codex-rules:end -->\n");
});

test("mergeRulesSection: replaces only the fenced section, preserves surrounding content", () => {
	const before = "# Before\n<!-- fusengine:codex-rules:start -->\nold rule\n<!-- fusengine:codex-rules:end -->\n# After\n";
	const next = mergeRulesSection(before, "new rule");
	expect(next).toBe("# Before\n<!-- fusengine:codex-rules:start -->\nnew rule\n<!-- fusengine:codex-rules:end -->\n# After\n");
});

test("mergeRulesSection: writes just the fence into an empty body", () => {
	expect(mergeRulesSection("", "rule A")).toBe("<!-- fusengine:codex-rules:start -->\nrule A\n<!-- fusengine:codex-rules:end -->\n");
});

test("ensureProjectDocMaxBytes: adds the key when absent", () => {
	expect(ensureProjectDocMaxBytes("model = \"gpt-5.5\"\n")).toBe("project_doc_max_bytes = 65536\nmodel = \"gpt-5.5\"\n");
});

test("ensureProjectDocMaxBytes: leaves an existing value untouched", () => {
	const src = "project_doc_max_bytes = 131072\nmodel = \"gpt-5.5\"\n";
	expect(ensureProjectDocMaxBytes(src)).toBe(src);
});

test("readRulesCorpus: empty string when the rules dir is missing", () => {
	expect(readRulesCorpus(join(tmpdir(), "no-such-rules-dir-xyz"))).toBe("");
});

test("mergeAgentsMd: idempotent end-to-end — two runs produce byte-identical output", async () => {
	const codexHome = mkdtempSync(join(tmpdir(), "probe-codex-"));
	const projectRoot = mkdtempSync(join(tmpdir(), "probe-project-"));
	const rulesDir = join(projectRoot, "plugins", "codex-rules", "rules");
	mkdirSync(rulesDir, { recursive: true });
	writeFileSync(join(rulesDir, "01-a.md"), "Rule A\n");
	writeFileSync(join(rulesDir, "02-b.md"), "Rule B\n");
	writeFileSync(join(codexHome, "AGENTS.md"), "# User preamble\n");
	writeFileSync(join(codexHome, "config.toml"), "model = \"gpt-5.5\"\n");

	await mergeAgentsMd(projectRoot, codexHome);
	const firstAgentsMd = readFileSync(join(codexHome, "AGENTS.md"), "utf-8");
	const firstConfig = readFileSync(join(codexHome, "config.toml"), "utf-8");

	await mergeAgentsMd(projectRoot, codexHome);
	const secondAgentsMd = readFileSync(join(codexHome, "AGENTS.md"), "utf-8");
	const secondConfig = readFileSync(join(codexHome, "config.toml"), "utf-8");

	expect(secondAgentsMd).toBe(firstAgentsMd);
	expect(secondConfig).toBe(firstConfig);
	expect(firstAgentsMd).toContain("# User preamble");
	expect(firstAgentsMd).toContain("Rule A\n\nRule B");
	expect(firstConfig).toBe("project_doc_max_bytes = 65536\nmodel = \"gpt-5.5\"\n");

	rmSync(codexHome, { recursive: true, force: true });
	rmSync(projectRoot, { recursive: true, force: true });
});

test("mergeAgentsMd: no-op when the rules dir is missing (clean pass-through for other harnesses)", async () => {
	const codexHome = mkdtempSync(join(tmpdir(), "probe-codex-noop-"));
	const projectRoot = mkdtempSync(join(tmpdir(), "probe-project-noop-"));
	await mergeAgentsMd(projectRoot, codexHome);
	expect(existsSync(join(codexHome, "AGENTS.md"))).toBe(false);
	rmSync(codexHome, { recursive: true, force: true });
	rmSync(projectRoot, { recursive: true, force: true });
});
