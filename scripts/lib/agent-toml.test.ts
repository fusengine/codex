import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "smol-toml";
import { buildAgentToml } from "./agent-toml";
import { agentRoleViolations } from "./agent-role-validation";

const SOL = [
	"challenger", "brainstorming", "sniper", "prompt-engineer", "research-expert",
	"security-expert", "solid-orchestrator",
];
const TERRA = [
	"astro-expert", "explore-codebase", "changelog-watcher", "design-expert", "go-expert", "websearch",
	"nextjs-expert", "laravel-expert", "php-expert", "rust-expert", "seo-geo", "seo-cluster",
	"seo-expert", "react-expert", "seo-schema", "seo-local", "seo-content", "shadcn-ui-expert",
	"swift-expert", "seo-technical", "tanstack-start-expert", "typescript-expert", "tailwindcss-expert",
];
const LUNA = [
	"commit", "sniper-faster", "cartographer", "commit-detector", "lessons-compactor",
	"seo-images", "seo-sitemap",
];

function agentSource(model?: string, effort?: string, effortKey = "effort"): string {
	const metadata = ["name: test-agent", "description: Test agent"];
	if (model) metadata.push(`model: ${model}`);
	if (effort) metadata.push(`${effortKey}: ${effort}`);
	return `---\n${metadata.join("\n")}\n---\nTest instructions.`;
}

test("selects the agent model tier with its strictly-paired reasoning effort", () => {
	const scenarios = [
		{ input: "opus", expectedModel: "gpt-5.6-sol", expectedEffort: "high" },
		{ input: "sonnet", expectedModel: "gpt-5.6-terra", expectedEffort: "medium" },
		{ input: "haiku", expectedModel: "gpt-5.6-luna", expectedEffort: "max" },
		{ input: "gpt-5.4", expectedModel: "gpt-5.6-terra", expectedEffort: "medium" },
		{ input: "gpt-5.5", expectedModel: "gpt-5.6-terra", expectedEffort: "medium" },
		{ input: undefined, expectedModel: "gpt-5.6-terra", expectedEffort: "medium" },
	];

	for (const scenario of scenarios) {
		const toml = buildAgentToml(agentSource(scenario.input));
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

test("ships the exact Sol/Terra/Luna agent matrix with strictly-paired reasoning effort", () => {
	const configs = shippedAgentConfigs();

	expect([...configs.keys()].sort()).toEqual([...SOL, ...TERRA, ...LUNA].sort());
	for (const name of SOL) expect(configs.get(name)?.model).toBe("gpt-5.6-sol");
	for (const name of TERRA) expect(configs.get(name)?.model).toBe("gpt-5.6-terra");
	for (const name of LUNA) expect(configs.get(name)?.model).toBe("gpt-5.6-luna");

	// Invariant: model tier and reasoning effort are strictly paired — never mixed.
	for (const config of configs.values()) {
		const model = String(config.model);
		const effort = config.model_reasoning_effort;
		if (model === "gpt-5.6-sol") expect(effort).toBe("high");
		else if (model === "gpt-5.6-terra") expect(effort).toBe("medium");
		else if (model === "gpt-5.6-luna") expect(effort).toBe("max");
		else throw new Error(`unexpected model tier: ${model}`);
	}
});

test("every shipped agent survives Codex agent role validation", () => {
	const violations = [...shippedAgentConfigs()].flatMap(([agent, config]) => agentRoleViolations(agent, config));

	expect(violations).toEqual([]);
});
