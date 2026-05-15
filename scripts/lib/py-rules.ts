/**
 * py-rules.ts — Per-line Python→TypeScript regex rules and unhandled
 * construct detection. Used by py-transform.ts.
 */

export function isPythonImport(line: string): boolean {
	return /^\s*(?:from\s+[\w.]+\s+import\s+.+|import\s+[\w.]+(?:\s+as\s+\w+)?)\s*$/.test(line);
}

export function detectUnhandled(line: string): string | null {
	if (/^\s*class\s+\w+/.test(line)) return "class declaration";
	if (/^\s*@\w+/.test(line)) return "decorator";
	if (/\[[^\]]*for\s+\w+\s+in\s+[^\]]+\]/.test(line)) return "list comprehension";
	if (/\{[^}]*for\s+\w+\s+in\s+[^}]+\}/.test(line)) return "dict/set comprehension";
	if (/\bimport\s+(urllib|hashlib|asyncio|threading|multiprocessing)/.test(line))
		return "stdlib (urllib/hashlib/asyncio/threading)";
	if (/\bfrom\s+(urllib|hashlib|asyncio)\s+import/.test(line))
		return "stdlib (urllib/hashlib/asyncio)";
	if (/^\s*async\s+def\b/.test(line)) return "async def";
	if (/\byield\b/.test(line)) return "yield (generator)";
	return null;
}

export function transformLine(line: string): string {
	let out = line;
	out = out.replace(/^#!.*python.*$/, "#!/usr/bin/env bun");
	out = out.replace(/\bjson\.loads\s*\(/g, "JSON.parse(");
	out = out.replace(/\bjson\.dumps\s*\(/g, "JSON.stringify(");
	out = out.replace(/\bjson\.load\s*\(\s*([^)]+)\)/g, "JSON.parse(await Bun.file($1).text())");
	out = out.replace(/\bsys\.exit\s*\(/g, "process.exit(");
	out = out.replace(/\bsys\.argv\b/g, "process.argv");
	out = out.replace(/\bsys\.stdin\.read\(\)/g, "await new Response(Bun.stdin.stream()).text()");
	out = out.replace(/\bos\.environ\.get\(\s*(['"][^'"]+['"])\s*,\s*([^)]+)\)/g, "(process.env[$1] ?? $2)");
	out = out.replace(/\bos\.environ\.get\(\s*(['"][^'"]+['"])\s*\)/g, "process.env[$1]");
	out = out.replace(/\bos\.environ\[\s*(['"][^'"]+['"])\s*\]/g, "process.env[$1]");
	out = out.replace(/\bos\.path\.join\(/g, "join(");
	out = out.replace(/\bos\.path\.exists\(/g, "existsSync(");
	out = out.replace(/\bos\.path\.isfile\(/g, "existsSync(");
	out = out.replace(/\bos\.path\.isdir\(/g, "existsSync(");
	out = out.replace(/\bos\.path\.expanduser\(\s*['"]~['"]\s*\)/g, "homedir()");
	out = out.replace(/\bos\.makedirs\(\s*([^,]+),\s*exist_ok=True\)/g, "mkdirSync($1, { recursive: true })");
	out = out.replace(/\bos\.makedirs\(([^)]+)\)/g, "mkdirSync($1, { recursive: true })");
	out = out.replace(/\bprint\(/g, "console.log(");
	out = out.replace(/\bre\.match\(\s*r?(['"])([^'"]+)\1\s*,\s*([^)]+)\)/g, "$3.match(/$2/)");
	out = out.replace(/\bre\.search\(\s*r?(['"])([^'"]+)\1\s*,\s*([^)]+)\)/g, "$3.match(/$2/)");
	out = out.replace(/\bre\.findall\(\s*r?(['"])([^'"]+)\1\s*,\s*([^)]+)\)/g, "Array.from($3.matchAll(/$2/g), m => m[1] ?? m[0])");
	out = out.replace(/\bre\.sub\(\s*r?(['"])([^'"]+)\1\s*,\s*(['"][^'"]*['"]),\s*([^)]+)\)/g, "$4.replace(/$2/g, $3)");
	out = out.replace(/\bTrue\b/g, "true");
	out = out.replace(/\bFalse\b/g, "false");
	out = out.replace(/\bNone\b/g, "null");
	out = out.replace(/\belif\b/g, "else if");
	out = out.replace(/\bnot\s+/g, "!");
	out = out.replace(/\band\b/g, "&&");
	out = out.replace(/\bor\b/g, "||");
	out = out.replace(/\bf(['"])([^'"]*)\1/g, (_m, _q, body) => "`" + body.replace(/\{([^}]+)\}/g, "${$1}") + "`");
	return out;
}
