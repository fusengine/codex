import { expect, test } from "bun:test";
import { isMcpTool } from "./mcp-names";

test("isMcpTool accepts dash and underscore server forms", () => {
  expect(isMcpTool("mcp__fuse-browser__browser_navigate", "fuse-browser", "browser_navigate")).toBe(true);
  expect(isMcpTool("mcp__fuse_browser__browser_navigate", "fuse-browser", "browser_navigate")).toBe(true);
  expect(isMcpTool("mcp__gemini-design__create_frontend", "gemini-design", "create_frontend")).toBe(true);
  expect(isMcpTool("mcp__gemini_design__create_frontend", "gemini-design", "create_frontend")).toBe(true);
});

test("isMcpTool rejects other tools and missing names", () => {
  expect(isMcpTool("mcp__fuse-browser__browser_screenshot", "fuse-browser", "browser_navigate")).toBe(false);
  expect(isMcpTool("mcp__gemini-design__modify_frontend", "gemini-design", "create_frontend")).toBe(false);
  expect(isMcpTool(undefined, "fuse-browser", "browser_navigate")).toBe(false);
  expect(isMcpTool("Write", "fuse-browser", "browser_navigate")).toBe(false);
});
