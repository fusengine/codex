import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const entryPoints = [
	"plugins/commit-pro/commands/commit.md",
	"plugins/commit-pro/skills/commit/SKILL.md",
];
const strategyFiles = [
	...entryPoints,
	"plugins/commit-pro/skills/git-flow/SKILL.md",
	"plugins/commit-pro/skills/post-commit/references/tag-timing.md",
];
const postCommit = "plugins/commit-pro/skills/post-commit/SKILL.md";

function read(relativePath: string): string {
	return readFileSync(join(root, relativePath), "utf8");
}

test("commit-pro keeps one merge and tag strategy across every entry point", () => {
	for (const relativePath of strategyFiles) {
		const content = read(relativePath);
		expect(content, relativePath).not.toContain("--squash");
		expect(content, relativePath).toContain("--merge");
	}
});

test("commit entry points preserve Claude remote modes with Codex authorization boundaries", () => {
	for (const relativePath of entryPoints) {
		const content = read(relativePath);
		expect(content, relativePath).toContain("FULL mode");
		expect(content, relativePath).toMatch(/LOCAL(?: mode|\*\*)/);
		expect(content, relativePath).toMatch(/DEGRADED(?: mode|\*\*)/);
		expect(content, relativePath).toContain("--body-file -");
		expect(content, relativePath).toContain("gh pr checks <pr> --watch && gh pr merge <pr> --merge");
		expect(content, relativePath).toContain('test -n "$(gh pr view <pr> --json mergedAt -q .mergedAt)"');
		expect(content, relativePath).toMatch(/explicitly authoriz|explicitly requested/);
		expect(content, relativePath).toContain("--no-pr");
		expect(content, relativePath).toContain("--no-merge");
		expect(content, relativePath).toMatch(/checks fail|CI checks \*\*FAIL\*\*/);
		expect(content, relativePath).toContain("branch protection");

		const mergeProof = content.indexOf("--json mergedAt");
		const fullTag = content.indexOf("git tag vX.Y.Z");
		const localMode = content.indexOf("#### LOCAL or DEGRADED mode");
		expect(mergeProof, relativePath).toBeGreaterThan(-1);
		expect(fullTag, relativePath).toBeGreaterThan(mergeProof);
		expect(localMode, relativePath).toBeGreaterThan(fullTag);
		expect(content.slice(localMode), relativePath).not.toContain("git push origin vX.Y.Z");
	}
});

test("post-commit delegates every tag mutation to the mode-aware commit step", () => {
	const content = read(postCommit);
	expect(content).toContain("Do not create or push a tag here");
	expect(content).toContain("confirmed FULL-mode merge");
	expect(content).toContain("local-only tag in LOCAL/DEGRADED mode");
});
