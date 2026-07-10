/**
 * config-prompt.ts — Interactive prompt for top-level Codex config keys.
 */
import * as p from "@clack/prompts";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { hasKey, getRootKey, setRootKey, hasAgentsSection, setAgentsThreads } from "./toml-helpers";
import { APPROVALS, FALLBACK_EFFORTS, PERSONALITIES, SANDBOXES, THREADS, type Choice } from "./config-options";
import { listCodexModels, type CodexModel } from "./model-catalog";

export type ModelLoader = (codexHome: string) => Promise<CodexModel[]>;

function modelChoices(models: CodexModel[], current?: string): Choice[] {
	if (models.length === 0 && current) return [{ value: current, label: current, hint: "current · catalog unavailable" }];
	return models.map((model) => ({
		value: model.model,
		label: model.model,
		hint: model.isDefault ? `${model.displayName} · default` : model.displayName,
	}));
}

function effortChoices(models: CodexModel[], model?: string): Choice[] {
	const efforts = models.find((item) => item.model === model)?.supportedReasoningEfforts ?? [];
	return efforts.length > 0
		? efforts.map((item) => ({ value: item.reasoningEffort, label: item.reasoningEffort, hint: item.description }))
		: FALLBACK_EFFORTS;
}

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

	if (getRootKey(next, "sandbox_mode") === "danger-full-access" && getRootKey(next, "approval_policy") === "never") {
		p.log.warn("sandbox_mode=danger-full-access + approval_policy=never: Codex will run anything, unsandboxed, with no confirmation ever.");
		const proceed = await p.confirm({ message: "Write this configuration anyway?", initialValue: false });
		if (p.isCancel(proceed) || !proceed) {
			p.log.info("Config write aborted — dangerous combo not confirmed");
			return;
		}
	}

	const threads = await pick("agents.max_threads", THREADS, hasAgentsSection(next));
	if (threads !== null) {
		next = setAgentsThreads(next, threads);
		changes++;
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
