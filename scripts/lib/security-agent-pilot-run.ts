import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";

const RUN_ROOT = ".codex/apex/security-pilot-runs";
const CASES_PATH = "docs/validation/security-agent-pilot/cases.json";
const BASELINE_PATH = "docs/validation/security-agent-pilot/baseline.toml";
const CANDIDATE_PATH = "plugins/security-expert/agents/security-expert.toml";
const TIMEOUT_MS = 180_000;

type PilotCase = { id: string; task: string };
type CasesDocument = { cases: PilotCase[] };
type RunnerInput = { caseFixture: string; group?: string; repeat: string; variant: string };
/** The `model` / `model_reasoning_effort` pair a run actually uses, read from the TOML under test. */
export type AgentProfile = { model: string; effort: string };

function sha256(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

function developerInstructions(toml: string): string {
	const config = parse(toml) as Record<string, unknown>;
	if (typeof config.developer_instructions !== "string") throw new Error("Agent TOML lacks developer_instructions");
	return config.developer_instructions;
}

/** Read the model and reasoning-effort actually declared by the candidate/baseline TOML being run. */
export function agentProfile(toml: string): AgentProfile {
	const config = parse(toml) as Record<string, unknown>;
	const { model, model_reasoning_effort: effort } = config;
	if (typeof model !== "string" || typeof effort !== "string") throw new Error("Agent TOML lacks model or model_reasoning_effort");
	return { model, effort };
}

function batchPrompt(cases: PilotCase[]): string {
	return [
		"Evaluate each labeled audit independently. Return exactly one report per case, preserving the case ID.",
		"Do not edit files, run Git commands, delegate remediation, or use mutating tools.",
		...cases.map((entry) => `\n## ${entry.id}\n${entry.task}`),
	].join("\n");
}

function runnerInput(args: string[]): RunnerInput {
	const [variant, repeat, ...options] = args;
	if ((variant !== "baseline" && variant !== "candidate") || !/^[1-9]\d*$/.test(repeat ?? "")) {
		throw new Error("Usage: bun scripts/lib/security-agent-pilot-run.ts <baseline|candidate> <positive-run-id> [--cases <path> --group <safe-name>]");
	}
	if (options.length === 0) return { variant, repeat, caseFixture: CASES_PATH };
	if (options.length !== 4 || options[0] !== "--cases" || options[2] !== "--group" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options[3] ?? "")) {
		throw new Error("Supplemental mode requires --cases <path> --group <safe-name>");
	}
	return { variant, repeat, caseFixture: options[1] ?? "", group: options[3] };
}

function validatedCases(raw: string, expectedCount: number): PilotCase[] {
	const parsed = JSON.parse(raw) as unknown;
	if (!parsed || typeof parsed !== "object") throw new Error(`Pilot fixture must contain exactly ${expectedCount} nonblank case(s)`);
	const document = parsed as CasesDocument | PilotCase;
	const cases = "cases" in document && Array.isArray(document.cases)
		? document.cases
		: expectedCount === 1 ? [document as PilotCase] : [];
	if (cases.length !== expectedCount || cases.some((entry) => typeof entry.id !== "string" || typeof entry.task !== "string" || !entry.id.trim() || !entry.task.trim())) {
		throw new Error(`Pilot fixture must contain exactly ${expectedCount} nonblank case(s)`);
	}
	return cases;
}

/** Build the `codex exec`/`codex debug prompt-input` argv, using the model/effort the TOML under test declares. */
export function command(subcommand: string[], profile: AgentProfile, instructions: string, prompt: string): string[] {
	return [
		"codex", ...subcommand,
		"-m", profile.model,
		"-s", "read-only",
		"-c", `model_reasoning_effort=${JSON.stringify(profile.effort)}`,
		"-c", `developer_instructions=${JSON.stringify(instructions)}`,
		"-C", resolve("."),
		prompt,
	];
}

/** Build the `codex debug prompt-input` argv used for the pre-run injection check. */
export function preflightCommand(profile: AgentProfile, instructions: string, prompt: string): string[] {
	return [
		"codex", "debug", "prompt-input",
		"-c", `model_reasoning_effort=${JSON.stringify(profile.effort)}`,
		"-c", `developer_instructions=${JSON.stringify(instructions)}`,
		prompt,
	];
}

async function execute(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string; timedOut: boolean }> {
	const process = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
	let timedOut = false;
	const timer = setTimeout(() => {
		timedOut = true;
		process.kill();
	}, TIMEOUT_MS);
	try {
		const [exitCode, stdout, stderr] = await Promise.all([process.exited, new Response(process.stdout).text(), new Response(process.stderr).text()]);
		return { exitCode, stdout, stderr, timedOut };
	} finally {
		clearTimeout(timer);
	}
}

function toolCalls(jsonl: string): unknown[] {
	return jsonl.split("\n").flatMap((line) => {
		try {
			const event = JSON.parse(line) as Record<string, unknown>;
			return JSON.stringify(event).toLowerCase().includes("tool") ? [event] : [];
		} catch {
			return [];
		}
	});
}

function preflightIncludesInstructions(jsonl: string, instructions: string): boolean {
	try {
		const messages = JSON.parse(jsonl) as unknown;
		return Array.isArray(messages) && messages.some((message) => {
			if (!message || typeof message !== "object") return false;
			const record = message as Record<string, unknown>;
			if (record.role !== "developer" || !Array.isArray(record.content)) return false;
			return record.content.some((item: unknown) => {
				if (!item || typeof item !== "object") return false;
				const content = item as Record<string, unknown>;
				return content.type === "input_text" && content.text === instructions;
			});
		});
	} catch { /* prompt-input may emit JSONL on future Codex versions */ }
	return false;
}

async function main(): Promise<void> {
	const input = runnerInput(Bun.argv.slice(2));
	const [source, casesRaw] = await Promise.all([readFile(input.variant === "baseline" ? BASELINE_PATH : CANDIDATE_PATH, "utf8"), readFile(input.caseFixture, "utf8")]);
	const cases = validatedCases(casesRaw, input.group ? 1 : 4);
	const instructions = developerInstructions(source);
	const profile = agentProfile(source);
	const prompt = batchPrompt(cases);
	const runBase = input.group ? resolve(RUN_ROOT, input.variant, input.group) : resolve(RUN_ROOT, input.variant);
	const runDir = resolve(runBase, `repeat-${input.repeat}`);
	const startedAt = new Date().toISOString();
	await mkdir(runBase, { recursive: true });
	await mkdir(runDir);
	const preflight = await execute(preflightCommand(profile, instructions, prompt));
	const injectedInstructions = preflightIncludesInstructions(preflight.stdout, instructions);
	const result = preflight.exitCode === 0 && injectedInstructions
		? await execute(command(["exec", "--ephemeral", "--json"], profile, instructions, prompt))
		: { exitCode: 1, stdout: "", stderr: "Exec skipped because prompt-input did not prove the exact developer instructions.", timedOut: false };
	const metadata = {
		variant: input.variant, repeat: Number(input.repeat), model: profile.model, reasoning_effort: profile.effort, sandbox: "read-only",
		case_fixture: input.caseFixture, case_fixture_sha256: sha256(casesRaw),
		prompt_sha256: sha256(prompt), developer_instructions_sha256: sha256(instructions),
		preflight_exit_code: preflight.exitCode, injected_instructions: injectedInstructions,
		exit_code: result.exitCode, timed_out: result.timedOut,
		case_ids: cases.map((entry) => entry.id), started_at: startedAt, ended_at: new Date().toISOString(),
	};
	await Promise.all([
		writeFile(resolve(runDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`),
		writeFile(resolve(runDir, "developer-instructions.txt"), instructions),
		writeFile(resolve(runDir, "preflight.json"), preflight.stdout),
		writeFile(resolve(runDir, "preflight.stderr.txt"), preflight.stderr),
		writeFile(resolve(runDir, "stdout.jsonl"), result.stdout),
		writeFile(resolve(runDir, "stderr.txt"), result.stderr),
		writeFile(resolve(runDir, "tool-calls.json"), `${JSON.stringify(toolCalls(result.stdout), null, 2)}\n`),
	]);
	if (preflight.exitCode !== 0 || result.exitCode !== 0 || result.timedOut) process.exitCode = 1;
}

if (import.meta.main) await main();
