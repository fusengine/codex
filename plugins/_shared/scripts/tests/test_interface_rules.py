#!/usr/bin/env python3
"""Tests for typed contract separation rules."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from interface_rules import contract_violation  # noqa: E402

BAD = """export function runBordel(input: any) {
  const state: { users: any[]; errors: string[]; config: { retry: number; url: string } } = {};
  return state;
}
"""
GOOD = """import type { BordelInput, BordelPayload } from "./bordel.types";
export function runBordel(input: BordelInput): BordelPayload {
  return { ok: true, count: input.rows.length, users: [], errors: [] };
}
"""

cases = [
    ("scripts/tests/bordel-inline-types.ts", BAD, True, "bad inline contracts"),
    ("scripts/tests/bordel.ts", "export interface Bordel { id: string }", True, "interface in implementation"),
    ("scripts/tests/bordel.ts", "type Bordel = { id: string; name: string }", True, "type in implementation"),
    ("scripts/tests/bordel.ts", GOOD, False, "named contracts"),
    ("scripts/tests/bordel.types.ts", "export type X = { a: string; b: string }", False, "types file"),
]

failures = 0
for path, content, expected, label in cases:
    blocked = bool(contract_violation(path, content))
    ok = blocked == expected
    print(f"{'OK  ' if ok else 'FAIL'} [{label}]: blocked={blocked}")
    failures += 0 if ok else 1
sys.exit(1 if failures else 0)
