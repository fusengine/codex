import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "smol-toml";
import { buildAgentToml } from "./agent-toml";
import { agentRoleViolations } from "./agent-role-validation";

const SOL = [
	"astro-expert", "brainstorming", "challenger", "changelog-watcher", "commit", "design-expert",
	"go-expert", "laravel-expert", "nextjs-expert", "php-expert", "prompt-engineer", "react-expert",
	"research-expert", "rust-expert", "security-expert", "seo-expert", "shadcn-ui-expert", "sniper",
	"solid-orchestrator", "swift-expert", "tailwindcss-expert", "tanstack-start-expert",
	"typescript-expert",
];
const TERRA = [
	"cartographer", "commit-detector", "explore-codebase", "seo-cluster", "seo-content", "seo-geo",
	"seo-images", "seo-local", "seo-schema", "seo-sitemap", "seo-technical", "sniper-faster",
	"websearch",
];

function agentSource(model?: string, effort?: string, effortKey = "effort"): string {
	const metadata = ["name: test-agent", "description: Test agent"];
	if (model) metadata.push(`model: ${model}`);
	if (effort) metadata.push(`${effortKey}: ${effort}`);
	return `---\n${metadata.join("\n")}\n---\nTest instructions.`;
}

test("selects the agent model tier and always uses high reasoning", () => {
	const scenarios = [
		{ input: "opus", expected: "gpt-5.6-sol", effort: "xhigh", effortKey: "effort" },
		{ input: "opus", expected: "gpt-5.6-sol", effort: "xhigh", effortKey: "model_reasoning_effort" },
		{ input: "sonnet", expected: "gpt-5.6-terra", effort: undefined, effortKey: undefined },
		{ input: "haiku", expected: "gpt-5.6-terra", effort: undefined, effortKey: undefined },
		{ input: "gpt-5.4", expected: "gpt-5.6-terra", effort: undefined, effortKey: undefined },
		{ input: "gpt-5.5", expected: "gpt-5.6-terra", effort: undefined, effortKey: undefined },
		{ input: undefined, expected: "gpt-5.6-terra", effort: undefined, effortKey: undefined },
	];

	for (const scenario of scenarios) {
		const toml = buildAgentToml(agentSource(scenario.input, scenario.effort, scenario.effortKey));
		expect(toml).toContain(`model = "${scenario.expected}"`);
		expect(toml).toContain('model_reasoning_effort = "high"');
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

test("ships the exact Sol and Terra agent matrix with high reasoning", () => {
	const configs = shippedAgentConfigs();

	expect([...configs.keys()].sort()).toEqual([...SOL, ...TERRA].sort());
	for (const name of SOL) expect(configs.get(name)?.model).toBe("gpt-5.6-sol");
	for (const name of TERRA) expect(configs.get(name)?.model).toBe("gpt-5.6-terra");
	for (const config of configs.values()) expect(config.model_reasoning_effort).toBe("high");
});

test("every shipped agent survives Codex agent role validation", () => {
	const violations = [...shippedAgentConfigs()].flatMap(([agent, config]) => agentRoleViolations(agent, config));

	expect(violations).toEqual([]);
});
