/**
 * agent-role-validation.ts — Conditions under which Codex discards an ENTIRE
 * agent role file. A rejected file only produces a one-line startup warning:
 * the agent silently never becomes spawnable. Shipping "Next.js Expert" made
 * nextjs-expert vanish this way — the dot is outside the nickname charset.
 *
 * Source: openai/codex at tag `rust-v0.144.6`,
 * `codex-rs/core/src/config/agent_roles.rs`.
 *
 * NOT checked here, deliberately: unknown top-level keys. RawAgentRoleFileToml
 * declares `#[serde(deny_unknown_fields)]`, but its `#[serde(flatten)] config:
 * ConfigToml` neutralises it (serde-rs/serde#2283), so the ~97 ConfigToml keys
 * are all legal at the top level and an unknown key is ignored, not fatal.
 */

/** Required on a standalone file discovered in `agents/`; blank counts as missing. */
const REQUIRED_FIELDS = ["name", "description", "developer_instructions"];

const ASCII_NICKNAME = /^[A-Za-z0-9 _-]+$/;

function isBlank(value: unknown): boolean {
	return typeof value !== "string" || value.trim() === "";
}

/** Codex trims every candidate, then rejects blanks, duplicates and non-ASCII. */
function nicknameViolations(agent: string, declared: unknown): string[] {
	if (declared === undefined) return []; // the field itself is optional
	if (!Array.isArray(declared) || declared.length === 0) {
		return [`${agent}: nickname_candidates must contain at least one name`];
	}
	const violations: string[] = [];
	const seen = new Set<string>();
	for (const raw of declared) {
		const nickname = String(raw).trim();
		if (nickname === "") violations.push(`${agent}: nickname_candidates cannot contain blank names`);
		else if (seen.has(nickname)) violations.push(`${agent}: duplicate nickname "${nickname}"`);
		else if (!ASCII_NICKNAME.test(nickname)) violations.push(`${agent}: illegal characters in nickname "${nickname}"`);
		seen.add(nickname);
	}
	return violations;
}

/** Reasons Codex would drop `config`; empty when the agent loads cleanly. */
export function agentRoleViolations(agent: string, config: Record<string, unknown>): string[] {
	const violations: string[] = [];
	for (const field of REQUIRED_FIELDS) {
		if (isBlank(config[field])) violations.push(`${agent}: ${field} must be present and non-blank`);
	}
	return [...violations, ...nicknameViolations(agent, config.nickname_candidates)];
}
