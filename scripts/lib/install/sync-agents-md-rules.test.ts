/**
 * sync-agents-md-rules.test.ts — prune-by-default, merge only behind the flag.
 */
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripRulesSection } from "./merge-agents-md";
import { MERGE_FLAG, pruneAgentsMdRules, syncAgentsMdRules } from "./sync-agents-md-rules";

const START = "<!-- fusengine:codex-rules:start -->";
const END = "<!-- fusengine:codex-rules:end -->";

afterEach(() => {
	delete process.env[MERGE_FLAG];
});

/** Temp CODEX_HOME + project root with a two-file rules corpus. */
function makeFixture(): { codexHome: string; projectRoot: string } {
	const codexHome = mkdtempSync(join(tmpdir(), "probe-codex-sync-"));
	const projectRoot = mkdtempSync(join(tmpdir(), "probe-project-sync-"));
	const rulesDir = join(projectRoot, "plugins", "codex-rules", "rules");
	mkdirSync(rulesDir, { recursive: true });
	writeFileSync(join(rulesDir, "01-a.md"), "Rule A\n");
	writeFileSync(join(rulesDir, "02-b.md"), "Rule B\n");
	return { codexHome, projectRoot };
}

test("stripRulesSection: removes the fence and keeps surrounding content", () => {
	const before = `# Before\n${START}\nold rule\n${END}\n# After\n`;
	expect(stripRulesSection(before)).toBe("# Before\n# After\n");
});

test("stripRulesSection: a body that is only the fence becomes empty", () => {
	expect(stripRulesSection(`${START}\nold rule\n${END}\n`)).toBe("");
});

test("stripRulesSection: leading fence keeps the content that follows", () => {
	expect(stripRulesSection(`${START}\nold\n${END}\n# After\n`)).toBe("# After\n");
});

test("stripRulesSection: no fence — body returned untouched", () => {
	expect(stripRulesSection("# Just notes\n")).toBe("# Just notes\n");
});

test("pruneAgentsMdRules: strips a merged fence, preserves user content", async () => {
	const { codexHome, projectRoot } = makeFixture();
	writeFileSync(join(codexHome, "AGENTS.md"), `# User preamble\n\n${START}\nRule A\n${END}\n`);

	expect(await pruneAgentsMdRules(codexHome)).toBe(true);
	const body = readFileSync(join(codexHome, "AGENTS.md"), "utf-8");
	expect(body).toBe("# User preamble\n");
	expect(body).not.toContain("fusengine:codex-rules");

	rmSync(codexHome, { recursive: true, force: true });
	rmSync(projectRoot, { recursive: true, force: true });
});

test("pruneAgentsMdRules: false when AGENTS.md is absent or fence-free", async () => {
	const { codexHome, projectRoot } = makeFixture();
	expect(await pruneAgentsMdRules(codexHome)).toBe(false);
	writeFileSync(join(codexHome, "AGENTS.md"), "# User preamble\n");
	expect(await pruneAgentsMdRules(codexHome)).toBe(false);
	expect(readFileSync(join(codexHome, "AGENTS.md"), "utf-8")).toBe("# User preamble\n");

	rmSync(codexHome, { recursive: true, force: true });
	rmSync(projectRoot, { recursive: true, force: true });
});

test("syncAgentsMdRules: default never writes the corpus into AGENTS.md", async () => {
	const { codexHome, projectRoot } = makeFixture();
	writeFileSync(join(codexHome, "AGENTS.md"), "# User preamble\n");
	writeFileSync(join(codexHome, "config.toml"), "model = \"gpt-5.5\"\n");

	expect(await syncAgentsMdRules(projectRoot, codexHome)).toBe("noop");
	expect(readFileSync(join(codexHome, "AGENTS.md"), "utf-8")).toBe("# User preamble\n");
	expect(readFileSync(join(codexHome, "config.toml"), "utf-8")).toBe("model = \"gpt-5.5\"\n");

	rmSync(codexHome, { recursive: true, force: true });
	rmSync(projectRoot, { recursive: true, force: true });
});

test("syncAgentsMdRules: default cleans up an AGENTS.md merged by an older install", async () => {
	const { codexHome, projectRoot } = makeFixture();
	writeFileSync(join(codexHome, "AGENTS.md"), `# User preamble\n\n${START}\nRule A\n\nRule B\n${END}\n`);

	expect(await syncAgentsMdRules(projectRoot, codexHome)).toBe("pruned");
	expect(existsSync(join(codexHome, "AGENTS.md"))).toBe(true);
	expect(readFileSync(join(codexHome, "AGENTS.md"), "utf-8")).toBe("# User preamble\n");

	rmSync(codexHome, { recursive: true, force: true });
	rmSync(projectRoot, { recursive: true, force: true });
});

test("syncAgentsMdRules: FUSE_RULES_MERGE_AGENTS_MD=1 restores the legacy merge", async () => {
	const { codexHome, projectRoot } = makeFixture();
	writeFileSync(join(codexHome, "AGENTS.md"), "# User preamble\n");
	writeFileSync(join(codexHome, "config.toml"), "model = \"gpt-5.5\"\n");
	process.env[MERGE_FLAG] = "1";

	expect(await syncAgentsMdRules(projectRoot, codexHome)).toBe("merged");
	const body = readFileSync(join(codexHome, "AGENTS.md"), "utf-8");
	expect(body).toContain("# User preamble");
	expect(body).toContain("Rule A\n\nRule B");

	rmSync(codexHome, { recursive: true, force: true });
	rmSync(projectRoot, { recursive: true, force: true });
});
