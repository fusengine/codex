import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "smol-toml";
import { buildAgentToml } from "./agent-toml";
import { agentRoleViolations } from "./agent-role-validation";

const TERRA_MEDIUM = [
	"astro-expert", "go-expert", "laravel-expert", "nextjs-expert", "php-expert", "react-expert", "rust-expert",
	"shadcn-ui-expert", "swift-expert", "tailwindcss-expert", "tanstack-start-expert", "typescript-expert",
	"explore-codebase", "research-expert", "websearch",
];
const SOL_MEDIUM = [
	"brainstorming", "solid-orchestrator", "commit", "changelog-watcher",
	"lessons-compactor", "seo-expert", "seo-content", "seo-geo", "seo-local", "seo-cluster", "seo-technical",
	"seo-schema", "sniper", "prompt-engineer", "challenger", "security-expert",
];
const SOL_HIGH = ["design-expert"];
const LUNA_MAX = ["sniper-faster", "commit-detector", "cartographer", "seo-images", "seo-sitemap"];

const EXPECTED_PROFILES: Record<string, readonly [string, string]> = Object.fromEntries([
	...TERRA_MEDIUM.map((name) => [name, ["gpt-5.6-terra", "medium"]]),
	...SOL_MEDIUM.map((name) => [name, ["gpt-5.6-sol", "medium"]]),
	...SOL_HIGH.map((name) => [name, ["gpt-5.6-sol", "high"]]),
	...LUNA_MAX.map((name) => [name, ["gpt-5.6-luna", "max"]]),
]);

function agentSource(name: string, model?: string): string {
	const metadata = [`name: ${name}`, "description: Test agent"];
	if (model) metadata.push(`model: ${model}`);
	return `---\n${metadata.join("\n")}\n---\nTest instructions.`;
}

test("selects name-specific profiles over Claude source model tiers", () => {
	const scenarios = [
		{ name: "design-expert", input: "sonnet", expectedModel: "gpt-5.6-sol", expectedEffort: "high" },
		{ name: "security-expert", input: "opus", expectedModel: "gpt-5.6-sol", expectedEffort: "medium" },
		{ name: "commit", input: "opus", expectedModel: "gpt-5.6-sol", expectedEffort: "medium" },
		{ name: "sniper-faster", input: "haiku", expectedModel: "gpt-5.6-luna", expectedEffort: "max" },
		{ name: "sniper", input: "opus", expectedModel: "gpt-5.6-sol", expectedEffort: "medium" },
		{ name: "typescript-expert", input: "sonnet", expectedModel: "gpt-5.6-terra", expectedEffort: "medium" },
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

	expect(TERRA_MEDIUM).toHaveLength(15);
	expect(SOL_MEDIUM).toHaveLength(16);
	expect(SOL_HIGH).toHaveLength(1);
	expect(LUNA_MAX).toHaveLength(5);
});

test("every shipped agent survives Codex agent role validation", () => {
	const violations = [...shippedAgentConfigs()].flatMap(([agent, config]) => agentRoleViolations(agent, config));

	expect(violations).toEqual([]);
});
