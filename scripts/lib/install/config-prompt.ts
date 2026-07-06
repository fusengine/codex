/**
 * config-prompt.ts — Interactive prompt for top-level Codex config keys.
 */
import * as p from "@clack/prompts";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { hasKey, getRootKey, setRootKey, hasAgentsSection, setAgentsThreads } from "./toml-helpers";

type Choice = { value: string; label: string; hint?: string };

const MODELS: Choice[] = [
	{ value: "gpt-5.5", label: "gpt-5.5", hint: "latest" },
	{ value: "gpt-5.4", label: "gpt-5.4" },
	{ value: "gpt-5.4-mini", label: "gpt-5.4-mini", hint: "faster" },
	{ value: "gpt-5-pro", label: "gpt-5-pro" },
];
const EFFORTS: Choice[] = ["minimal", "low", "medium", "high", "xhigh"].map((v) => ({ value: v, label: v }));
const PERSONALITIES: Choice[] = ["none", "friendly", "pragmatic"].map((v) => ({ value: v, label: v }));
const APPROVALS: Choice[] = [
	{ value: "untrusted", label: "untrusted", hint: "asks before everything not allowlisted" },
	{ value: "on-request", label: "on-request", hint: "the model decides when to ask (recommended)" },
	{ value: "never", label: "never", hint: "never interrupts, returns failures to the model" },
];
const SANDBOXES: Choice[] = ["read-only", "workspace-write", "danger-full-access"].map((v) => ({ value: v, label: v }));
const THREADS: Choice[] = ["6", "8", "12", "16"].map((v) => ({ value: v, label: v, hint: v === "6" ? "default" : undefined }));

async function pick(label: string, options: Choice[], current: boolean): Promise<string | null> {
	const message = current ? `${label} (set — pick to override or skip)` : label;
	const choice = await p.select({ message, options: [...options, { value: "__skip", label: "(skip)" }] });
	if (p.isCancel(choice) || choice === "__skip") return null;
	return choice as string;
}

export async function promptCodexConfig(codexHome: string): Promise<void> {
	await mkdir(codexHome, { recursive: true });
	const path = join(codexHome, "config.toml");
	const file = Bun.file(path);
	const existing = (await file.exists()) ? await file.text() : "";
	let next = existing;

	p.log.step("Codex CLI base config");

	const fields: Array<[string, Choice[]]> = [
		["model", MODELS],
		["model_reasoning_effort", EFFORTS],
		["personality", PERSONALITIES],
		["approval_policy", APPROVALS],
		["sandbox_mode", SANDBOXES],
	];

	let changes = 0;
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
