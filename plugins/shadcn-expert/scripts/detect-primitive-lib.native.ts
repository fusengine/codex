#!/usr/bin/env bun
// @hook-entry
/**
 * detect-primitive-lib.native.ts — native TS port of
 * _legacy_py/detect-primitive-lib.py.
 *
 * CLI utility (invoked with a project root as argv[1], default cwd): aggregates
 * the Radix/Base-UI detection signals and prints a JSON verdict
 * {primitive, confidence, pm, runner, signals}. Scoring + tie-breaking match the
 * Python; JSON whitespace differs (JSON.stringify is compact).
 */
import {
  checkPkgJson, checkComponentsJson, scanImportsAndAttrs, detectPm,
} from "./lib/primitive-checks";

const root = process.argv[2] ?? process.cwd();
const signals: string[] = [];

const [r1, b1] = checkPkgJson(root, signals);
const [r2, b2] = checkComponentsJson(root, signals);
const [r3, b3] = scanImportsAndAttrs(root, signals);
const [pm, runner] = detectPm(root, signals);

const radix = r1 + r2 + r3;
const baseui = b1 + b2 + b3;

let primitive: string;
let confidence: number;
if (radix > 0 && baseui > 0) { primitive = "mixed"; confidence = Math.floor((radix + baseui) / 2); }
else if (radix > baseui) { primitive = "radix"; confidence = radix; }
else if (baseui > radix) { primitive = "base-ui"; confidence = baseui; }
else { primitive = "none"; confidence = 0; }

console.log(JSON.stringify({ primitive, confidence, pm, runner, signals }));
