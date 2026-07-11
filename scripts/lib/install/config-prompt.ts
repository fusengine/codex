/**
 * config-prompt.ts — Interactive prompt for top-level Codex config keys.
 */
import * as p from "@clack/prompts";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { getRootKey, hasKey, setRootKey } from "./toml-helpers";
import { hasTableKey, setTableKey } from "./toml-table-helpers";
import { APPROVALS, PERSONALITIES, SANDBOXES, V2_CONCURRENCY, type Choice } from "./config-options";
import { effortChoices, modelChoices } from "./config-model-options";
import { listCodexModels, type CodexModel } from "./model-catalog";

export type ModelLoader = (codexHome: string) => Promise<CodexModel[]>;

async function pick(label: string, options: Choice[], current: boolean): Promise<string | null> {
	const message = current ? `${label} (set — pick to override or skip)` : label;
	const choice = await p.select({ message, options: [...options, { value: "__skip", label: "(skip)" }] });
	if (p.isCancel(choice) || choice === "__skip") return null;
	return choice as string;
}

export async function promptCodexConfig(codexHome: string, loadModels: ModelLoader = listCodexModels): Promise<void> {
	await mkdir(codexHome, { recursive: true });
	const path = join(codexHome, "config.toml");
	const file = Bun.file(path);
	const existing = (await file.exists()) ? await file.text() : "";
	let next = existing;

	p.log.step("Codex CLI base config");
	const models = await loadModels(codexHome);
	const choices = modelChoices(models, getRootKey(next, "model"));
	if (choices.length > 0) {
		const model = await pick("model", choices, hasKey(next, "model"));
		if (model !== null) next = setRootKey(next, "model", model);
	} else {
		p.log.warn("Codex model catalog unavailable — model selection skipped");
	}

	const fields: Array<[string, Choice[]]> = [
		["model_reasoning_effort", effortChoices(models, getRootKey(next, "model"))],
		["personality", PERSONALITIES],
		["approval_policy", APPROVALS],
		["sandbox_mode", SANDBOXES],
	];

	let changes = next === existing ? 0 : 1;
	for (const [key, options] of fields) {
		const value = await pick(key, options, hasKey(next, key));
		if (value !== null) {
			next = setRootKey(next, key, value);
			changes++;
		}
	}
	const concurrency = await pick(
		"features.multi_agent_v2.max_concurrent_threads_per_session",
		V2_CONCURRENCY,
		hasTableKey(next, "features.multi_agent_v2", "max_concurrent_threads_per_session"),
	);
	if (concurrency !== null) {
		next = setTableKey(next, "features.multi_agent_v2", "max_concurrent_threads_per_session", concurrency);
		changes++;
	}

	if (getRootKey(next, "sandbox_mode") === "danger-full-access" && getRootKey(next, "approval_policy") === "never") {
		p.log.warn("sandbox_mode=danger-full-access + approval_policy=never: Codex will run anything, unsandboxed, with no confirmation ever.");
		const proceed = await p.confirm({ message: "Write this configuration anyway?", initialValue: false });
		if (p.isCancel(proceed) || !proceed) {
			p.log.info("Config write aborted — dangerous combo not confirmed");
			return;
		}
	}

	if (!hasKey(next, "suppress_unstable_features_warning")) {
		next = setRootKey(next, "suppress_unstable_features_warning", "true", false);
		changes++;
	}

	if (next !== existing) {
		await Bun.write(path, next);
		p.log.success(`Wrote ${changes} config key(s) to ${path}`);
	} else {
		p.log.info("Config unchanged");
	}
}
