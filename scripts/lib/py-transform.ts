/**
 * py-transform.ts — Best-effort Python → Bun TypeScript transformer.
 * Strips docstrings, drops Python imports (preamble provides TS imports),
 * maps simple constructs via regex, and tags unhandled lines with TODO.
 */
import { isPythonImport, detectUnhandled, transformLine } from "./py-rules";

const TODO = "// TODO[py→ts]:";

interface Result {
	code: string;
	warnings: string[];
}

function preamble(): string {
	return [
		"#!/usr/bin/env bun",
		`import { join, dirname, basename } from "node:path";`,
		`import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";`,
		`import { homedir } from "node:os";`,
		"",
	].join("\n");
}

function stripDocstrings(src: string): string {
	let out = src.replace(/"""([\s\S]*?)"""/g, (_m, body) => `/* ${body.replace(/\*\//g, "* /")} */`);
	out = out.replace(/'''([\s\S]*?)'''/g, (_m, body) => `/* ${body.replace(/\*\//g, "* /")} */`);
	return out;
}

export function transformPython(src: string, _path: string): Result {
	const warnings: string[] = [];
	const lines = stripDocstrings(src).split("\n");
	const out: string[] = [];
	const hadShebang = /^#!.*python/.test(lines[0] ?? "");
	out.push(preamble());
	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i] ?? "";
		if (i === 0 && hadShebang) continue;
		if (isPythonImport(raw)) {
			out.push(`// (removed py import) ${raw.trim()}`);
			continue;
		}
		const unhandled = detectUnhandled(raw);
		if (unhandled) {
			warnings.push(`L${i + 1}: ${unhandled}`);
			out.push(`${TODO} ${unhandled}`);
			out.push(`// ${raw}`);
			continue;
		}
		out.push(transformLine(raw));
	}
	out.push("");
	return { code: out.join("\n"), warnings };
}
