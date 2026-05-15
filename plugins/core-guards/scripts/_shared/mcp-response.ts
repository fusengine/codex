/** Helpers for normalizing MCP tool_response payloads into markdown text. */

const MAX_DEPTH = 5;

export function extractText(toolResponse: unknown, depth = 0): string {
	if (depth >= MAX_DEPTH) return "";
	if (typeof toolResponse === "string") return toolResponse;
	if (Array.isArray(toolResponse)) {
		const parts = toolResponse
			.filter((b): b is { type: string; text?: string } =>
				!!b && typeof b === "object" && (b as { type?: unknown }).type === "text")
			.map((b) => b.text ?? "");
		if (parts.length) return parts.join("\n\n");
		const nested = toolResponse
			.filter((b) => Array.isArray(b) || (b && typeof b === "object"))
			.map((b) => extractText(b, depth + 1))
			.filter((p) => p);
		if (nested.length) return nested.join("\n\n");
	}
	if (!toolResponse) return "";
	try {
		return JSON.stringify(toolResponse);
	} catch {
		return "";
	}
}
