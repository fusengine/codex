/**
 * interface-rules.test.ts — bun test port of
 * _shared/scripts/tests/test_interface_rules.py. Verifies the TS contractViolation
 * blocks inline/any/named-type contracts in implementation files and passes named
 * contracts + dedicated *.types.ts files.
 */
import { test, expect } from "bun:test";
import { contractViolation } from "../interface-rules";

const BAD = `export function runBordel(input: any) {
  const state: { users: any[]; errors: string[]; config: { retry: number; url: string } } = {};
  return state;
}
`;
const GOOD = `import type { BordelInput, BordelPayload } from "./bordel.types";
export function runBordel(input: BordelInput): BordelPayload {
  return { ok: true, count: input.rows.length, users: [], errors: [] };
}
`;

const cases: [string, string, boolean, string][] = [
  ["scripts/tests/bordel-inline-types.ts", BAD, true, "bad inline contracts"],
  ["scripts/tests/bordel.ts", "export interface Bordel { id: string }", true, "interface in implementation"],
  ["scripts/tests/bordel.ts", "type Bordel = { id: string; name: string }", true, "type in implementation"],
  ["scripts/tests/bordel.ts", GOOD, false, "named contracts"],
  ["scripts/tests/bordel.types.ts", "export type X = { a: string; b: string }", false, "types file"],
];

for (const [path, content, expected, label] of cases) {
  test(`contractViolation — ${label}`, () => {
    expect(Boolean(contractViolation(path, content))).toBe(expected);
  });
}
