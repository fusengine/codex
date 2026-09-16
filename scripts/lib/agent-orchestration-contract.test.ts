import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const read = (path: string): string => readFileSync(join(root, path), "utf8");

const policy = {
	agents: read("AGENTS.md"),
	orchestration: read("plugins/ai-pilot/skills/lead-orchestration/SKILL.md"),
	teams: read("plugins/codex-rules/rules/03-agent-teams.md"),
	quick: read("plugins/ai-pilot/commands/apex-quick.md"),
} as const;

const threeExpertsFloor = /at least three domain experts matching the project stack/i;

test("code changes require codebase exploration and the full Analyze trio", () => {
	expect(policy.agents).toMatch(/Every code (?:task|change) MUST (?:include|launch).*`explore-codebase`.*Analyze/is);
	for (const source of [policy.orchestration, policy.quick]) {
		expect(source).toMatch(/explore-codebase.*research-expert.*domain expert/is);
	}
	expect(policy.teams).toMatch(/\$ai-pilot:lead-orchestration/i);
});

test("writer allocation follows the dependency graph and still meets the >=3 domain-expert floor", () => {
	expect(policy.orchestration).toMatch(/coupled.*one writer|one writer.*coupled/is);
	expect(policy.orchestration).toMatch(/independent.*(?:disjoint|ownership)|(?:disjoint|ownership).*independent/is);
	expect(policy.quick).toMatch(/\$ai-pilot:lead-orchestration/i);
	expect(policy.orchestration).toMatch(threeExpertsFloor);
});

test("APEX gates remain mandatory after execution", () => {
	for (const source of [policy.agents, policy.quick]) {
		expect(source).toMatch(/elicitation.*--auto.*challeng/is);
		expect(source).toMatch(/verification.*challeng/is);
		expect(source).toMatch(/sniper/is);
		expect(source).toMatch(/--skip-elicit.*ignored|ignore.*--skip-elicit/is);
	}
});
