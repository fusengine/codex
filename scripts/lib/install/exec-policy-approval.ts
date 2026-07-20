/**
 * exec-policy-approval.ts — post-hoc `approval_policy` guarantee, run AFTER `promptCodexConfig`.
 * That prompt is skippable (Ctrl-C or "(skip)"); without this pass, freshly-deposited
 * exec-policy `prompt` rules could sit inert with no `approval_policy` key at all.
 */
import { join } from "node:path";
import * as p from "@clack/prompts";
import { getRootKey, hasKey, setRootKey } from "./toml-helpers";

/** Single-field default — deliberately not the `{ granular = ... }` form (openai/codex#25312, open enforcement bug). */
const DEFAULT_APPROVAL_POLICY = "on-request";

/**
 * Ensures `config.toml` carries an `approval_policy`:
 * - absent → written to `"on-request"` (single unambiguous field, no 5-field granular struct).
 * - `"never"` → left UNCHANGED (explicit user choice), only warned about: it turns every
 *   `prompt` exec-policy rule into a silent hard block, with no approval prompt ever shown.
 * - any other explicit value → left untouched, no warning.
 */
export async function ensureApprovalPolicy(codexHome: string): Promise<void> {
	const path = join(codexHome, "config.toml");
	const file = Bun.file(path);
	const existing = (await file.exists()) ? await file.text() : "";

	if (!hasKey(existing, "approval_policy")) {
		const next = setRootKey(existing, "approval_policy", DEFAULT_APPROVAL_POLICY);
		await Bun.write(path, next);
		p.log.info(`approval_policy was unset — defaulted to "${DEFAULT_APPROVAL_POLICY}" so exec-policy rules can prompt`);
		return;
	}

	if (getRootKey(existing, "approval_policy") === "never") {
		p.log.warn(
			'approval_policy="never": exec-policy "prompt" rules will hard-block instead of asking — Codex will never show an approval prompt.',
		);
	}
}
