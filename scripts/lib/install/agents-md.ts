/**
 * agents-md.ts — Copy AGENTS.md to $CODEX_HOME (default ~/.codex/AGENTS.md),
 * prompting before overwrite. Codex reads this on every session start.
 * Reference: developers.openai.com/codex/guides/agents-md
 */
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import * as p from "@clack/prompts";

export async function installAgentsMd(srcPath: string, destPath: string): Promise<void> {
	const src = Bun.file(srcPath);
	if (!(await src.exists())) {
		p.log.warn(`AGENTS.md missing at ${srcPath}`);
		return;
	}
	const dest = Bun.file(destPath);
	if (await dest.exists()) {
		const overwrite = await p.confirm({
			message: `Overwrite existing ${destPath}?`,
			initialValue: false,
		});
		if (p.isCancel(overwrite) || !overwrite) {
			p.log.info("Keeping existing AGENTS.md");
			return;
		}
	}
	await mkdir(dirname(destPath), { recursive: true });
	await Bun.write(destPath, await src.text());
	p.log.success(`AGENTS.md installed → ${destPath}`);
}
