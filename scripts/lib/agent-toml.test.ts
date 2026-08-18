import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "smol-toml";
import { buildAgentToml } from "./agent-toml";
import { agentRoleViolations } from "./agent-role-validation";

const SOL_MEDIUM = [
	"astro-expert", "changelog-watcher", "explore-codebase", "go-expert", "laravel-expert", "nextjs-expert",
	"php-expert", "react-expert", "rust-expert", "seo-cluster", "seo-content", "seo-expert", "seo-geo",
	"seo-local", "seo-schema", "seo-technical", "shadcn-ui-expert", "swift-expert", "tailwindcss-expert",
	"tanstack-start-expert", "typescript-expert", "websearch",
];
const SOL_HIGH = ["brainstorming", "challenger", "prompt-engineer", "research-expert", "security-expert", "sniper", "solid-orchestrator"];
const SOL_XHIGH = ["design-expert"];
const LUNA_MAX = ["cartographer", "commit-detector", "lessons-compactor", "seo-images", "seo-sitemap", "sniper-faster"];
const TERRA_HIGH = ["commit"];

const EXPECTED_PROFILES: Record<string, readonly [string, string]> = Object.fromEntries([
	...SOL_MEDIUM.map((name) => [name, ["gpt-5.6-sol", "medium"]]),
	...SOL_HIGH.map((name) => [name, ["gpt-5.6-sol", "high"]]),
	...SOL_XHIGH.map((name) => [name, ["gpt-5.6-sol", "xhigh"]]),
	...LUNA_MAX.map((name) => [name, ["gpt-5.6-luna", "max"]]),
	...TERRA_HIGH.map((name) => [name, ["gpt-5.6-terra", "high"]]),
]);

function agentSource(name: string, model?: string): string {
	const metadata = [`name: ${name}`, "description: Test agent"];
	if (model) metadata.push(`model: ${model}`);
	return `---\n${metadata.join("\n")}\n---\nTest instructions.`;
}

test("selects name-specific profiles over Claude source model tiers", () => {
	const scenarios = [
		{ name: "design-expert", input: "sonnet", expectedModel: "gpt-5.6-sol", expectedEffort: "xhigh" },
		{ name: "commit", input: "opus", expectedModel: "gpt-5.6-terra", expectedEffort: "high" },
		{ name: "sniper-faster", input: "haiku", expectedModel: "gpt-5.6-luna", expectedEffort: "max" },
		{ name: "typescript-expert", input: "sonnet", expectedModel: "gpt-5.6-sol", expectedEffort: "medium" },
		{ name: "future-agent", input: "opus", expectedModel: "gpt-5.6-sol", expectedEffort: "medium" },
	];

	for (const scenario of scenarios) {
		const toml = buildAgentToml(agentSource(scenario.name, scenario.input));
		expect(toml).toContain(`model = "${scenario.expectedModel}"`);
		expect(toml).toContain(`model_reasoning_effort = "${scenario.expectedEffort}"`);
	}
});

/** Every agent TOML the repo ships, keyed by the `name` it declares. */
function shippedAgentConfigs(): Map<string, Record<string, unknown>> {
	const configs = new Map<string, Record<string, unknown>>();
	for (const plugin of readdirSync("plugins")) {
		const agentsDir = join("plugins", plugin, "agents");
		try {
			for (const file of readdirSync(agentsDir).filter((name) => name.endsWith(".toml"))) {
				const config = parse(readFileSync(join(agentsDir, file), "utf8"));
				configs.set(String(config.name), config);
			}
		} catch { /* plugin has no agents */ }
	}
	return configs;
}

test("ships the exact 37-agent model and reasoning-effort matrix", () => {
	const configs = shippedAgentConfigs();

	expect(configs.size).toBe(37);
	expect([...configs.keys()].sort()).toEqual(Object.keys(EXPECTED_PROFILES).sort());
	for (const [name, [model, effort]] of Object.entries(EXPECTED_PROFILES)) {
		expect(configs.get(name)?.model).toBe(model);
		expect(configs.get(name)?.model_reasoning_effort).toBe(effort);
	}

	expect(SOL_MEDIUM).toHaveLength(22);
	expect(SOL_HIGH).toHaveLength(7);
	expect(SOL_XHIGH).toHaveLength(1);
	expect(LUNA_MAX).toHaveLength(6);
	expect(TERRA_HIGH).toHaveLength(1);
});

test("every shipped agent survives Codex agent role validation", () => {
	const violations = [...shippedAgentConfigs()].flatMap(([agent, config]) => agentRoleViolations(agent, config));

	expect(violations).toEqual([]);
});
