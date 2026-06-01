/**
 * shell-read-paths.test.ts — bun test port of
 * _shared/scripts/tests/test_shell_read_paths.py. Verifies the TS
 * skillDocPathFromPayload extracts the same skill-doc path from Read and shell
 * read commands (sed/cat/rg, absolute + cwd-relative) and ignores non-read shells.
 */
import { test, expect } from "bun:test";
import { skillDocPathFromPayload } from "../shell-read-paths";

const ROOT = "/repo";
const SKILL = "/repo/plugins/react-expert/skills/react-19/SKILL.md";

const cases: [string, Record<string, unknown>, string][] = [
  ["read tool", { tool_name: "Read", tool_input: { file_path: SKILL } }, SKILL],
  ["sed absolute", { tool_name: "Bash", tool_input: { command: `sed -n '1,80p' ${SKILL}` } }, SKILL],
  ["cat relative", { tool_name: "Bash", cwd: ROOT, tool_input: { command: "cat plugins/react-expert/skills/react-19/SKILL.md" } }, SKILL],
  ["rg absolute", { tool_name: "Bash", tool_input: { command: `rg hooks ${SKILL}` } }, SKILL],
  ["non-read shell", { tool_name: "Bash", tool_input: { command: "python3 script.py" } }, ""],
];

for (const [label, payload, expected] of cases) {
  test(`skillDocPathFromPayload — ${label}`, () => {
    expect(skillDocPathFromPayload(payload)).toBe(expected);
  });
}
