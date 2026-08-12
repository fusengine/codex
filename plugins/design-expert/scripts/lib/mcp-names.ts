/**
 * mcp-names.ts — dual-form MCP tool name matching.
 *
 * Codex normalizes MCP server names `-` → `_` at runtime (e.g.
 * `mcp__fuse_browser__browser_navigate`) while Claude/Kimi emit the dash form
 * (`mcp__fuse-browser__browser_navigate`). Comparisons must accept both.
 */

/**
 * True when `toolName` matches `mcp__<server>__<tool>` in dash or underscore
 * server form.
 * @param toolName - Raw tool name from the hook event.
 * @param server - Canonical dash-form server name (e.g. "fuse-browser").
 * @param tool - Tool name (e.g. "browser_navigate").
 */
export function isMcpTool(toolName: string | undefined, server: string, tool: string): boolean {
  return toolName === `mcp__${server}__${tool}`
    || toolName === `mcp__${server.replaceAll("-", "_")}__${tool}`;
}

/**
 * True when `toolName` is an MCP tool of `server`, dash or underscore server
 * form (substring match on the `__<server>__` segment).
 * @param toolName - Raw tool name from the hook event.
 * @param server - Canonical dash-form server name (e.g. "fuse-browser").
 */
export function mcpServerMatches(toolName: string, server: string): boolean {
  return toolName.includes(`__${server}__`)
    || toolName.includes(`__${server.replaceAll("-", "_")}__`);
}
