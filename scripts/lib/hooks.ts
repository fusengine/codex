import { join, basename } from "node:path";
import { mkdir } from "node:fs/promises";
import { generatedHookCommand } from "./hook-generation";
import { EVENT_MAP, UNSUPPORTED_EVENTS, rewriteMatcher } from "./hooks-rewrite";
import type { ClaudeHookEntry, ClaudeHooksFile, CodexHooksFile } from "./hooks-types";

function filterHooks(
	hooks: ClaudeHookEntry[],
	plugin: string,
	claudeEvent: string,
	codexEvent: string,
	matcher: string,
	warnings: string[],
) {
	return hooks
		.map((h) => {
			if (h.type !== "command" || typeof h.command !== "string") {
				warnings.push(
					`${plugin}: ${claudeEvent} hook type='${h.type}' skipped (Codex only supports type='command')`,
				);
				return null;
			}
			const command = generatedHookCommand(plugin, codexEvent, matcher);
			if (!command) {
				warnings.push(`${plugin}: ${codexEvent}/${matcher || "<empty>"} command skipped (no Harness route)`);
				return null;
			}
			return {
				type: "command",
				command,
				...(h.timeout !== undefined ? { timeout: h.timeout } : {}),
			};
		})
		.filter((h) => h !== null);
}

/**
 * Transform a Codex hooks.json into a Codex-compatible hooks.json.
 * errors[] = blocking (parse fail). warnings[] = skipped Codex-only events/types.
 */
export async function transformHooks(
	srcDir: string,
	destDir: string,
): Promise<{ converted: number; errors: string[]; warnings: string[] }> {
	const errors: string[] = [];
	const warnings: string[] = [];
	const plugin = basename(srcDir);
	const srcFile = join(srcDir, "hooks", "hooks.json");
	const file = Bun.file(srcFile);
	if (!(await file.exists())) return { converted: 0, errors, warnings };

	let parsed: ClaudeHooksFile;
	try {
		parsed = JSON.parse(await file.text());
	} catch (e) {
		errors.push(`${plugin}/hooks/hooks.json: invalid JSON (${(e as Error).message})`);
		return { converted: 0, errors, warnings };
	}

	const output: CodexHooksFile = { hooks: {} };
	for (const [claudeEvent, matchers] of Object.entries(parsed.hooks ?? {})) {
		const codexEvent = EVENT_MAP[claudeEvent];
		if (!codexEvent) {
			const msg = UNSUPPORTED_EVENTS.has(claudeEvent)
				? `${plugin}: event '${claudeEvent}' has no Codex equivalent (skipped)`
				: `${plugin}: unknown event '${claudeEvent}' (skipped)`;
			warnings.push(msg);
			continue;
		}
		const rewritten = matchers
			.map((m) => {
				const matcher = rewriteMatcher(m.matcher ?? "");
				return { matcher, hooks: filterHooks(m.hooks, plugin, claudeEvent, codexEvent, matcher, warnings) };
			})
			.filter((m) => m.hooks.length > 0);
		const existing = output.hooks[codexEvent] ?? [];
		output.hooks[codexEvent] = [...existing, ...rewritten];
	}

	const destHooksDir = join(destDir, "hooks");
	await mkdir(destHooksDir, { recursive: true });
	await Bun.write(join(destHooksDir, "hooks.json"), JSON.stringify(output, null, 2));
	return { converted: 1, errors, warnings };
}
