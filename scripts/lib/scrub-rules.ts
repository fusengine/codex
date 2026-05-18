/**
 * scrub-rules.ts — Ordered Codex → Codex string replacements.
 * Order matters: specific patterns first so they aren't swallowed by broader ones.
 */

interface Rule {
	pattern: RegExp;
	replacement: string;
}

const RULES: Rule[] = [
	{ pattern: /\$\{PLUGIN_ROOT\}/g, replacement: "${PLUGIN_ROOT}" },
	{ pattern: /\$\{PLUGIN_DATA\}/g, replacement: "${PLUGIN_DATA}" },
	{ pattern: /\$PLUGIN_ROOT\b/g, replacement: "$PLUGIN_ROOT" },
	{ pattern: /\$PLUGIN_DATA\b/g, replacement: "$PLUGIN_DATA" },
	{ pattern: /\bCLAUDE_PLUGIN_ROOT\b/g, replacement: "PLUGIN_ROOT" },
	{ pattern: /\bCLAUDE_PLUGIN_DATA\b/g, replacement: "PLUGIN_DATA" },
	{ pattern: /\bCLAUDE_PROJECT_DIR\b/g, replacement: "cwd" },
	{ pattern: /\bCLAUDE_HOME\b/g, replacement: "CODEX_HOME" },
	{ pattern: /~\/\.codex\b/g, replacement: "~/.codex" },
	{ pattern: /\.codex\/plugins\/marketplaces\b/g, replacement: ".codex/marketplaces" },
	{ pattern: /\.codex\/plugins\b/g, replacement: ".codex/plugins" },
	{ pattern: /\.codex\/agents\b/g, replacement: ".codex/agents" },
	{ pattern: /\.codex\/logs\b/g, replacement: ".codex/fusengine/logs" },
	{ pattern: /\.codex-plugin\b/g, replacement: ".codex-plugin" },
	{ pattern: /\bCLAUDE\.md\b/g, replacement: "AGENTS.md" },
	{ pattern: /\bclaude-plugins\b/g, replacement: "codex-plugins" },
	{ pattern: /\bClaude Code\b/g, replacement: "Codex CLI" },
	{ pattern: /\bClaude CLI\b/g, replacement: "Codex CLI" },
	{ pattern: /\bAnthropic Codex\b/g, replacement: "OpenAI Codex" },
	{ pattern: /\bClaude\b/g, replacement: "Codex" },
	{ pattern: /\bclaude\b/g, replacement: "codex" },
];

export function applyRules(src: string): { content: string; count: number } {
	let count = 0;
	let out = src;
	for (const { pattern, replacement } of RULES) {
		out = out.replace(pattern, () => {
			count++;
			return replacement;
		});
	}
	return { content: out, count };
}
