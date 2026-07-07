/**
 * interface-rules.ts — bundle-safe TS port of _shared/scripts/interface_rules.py.
 * Contract-separation checks for typed source files (enforce-interfaces). Every
 * regex is verbatim from the Python for strict parity.
 */

// TS-ONLY: these checks (named interface/type, `any`, inline object TYPE) are TypeScript
// syntax. On vanilla .js/.jsx a plain object literal `{ a: 1, b: 2 }` is indistinguishable
// from a TS inline type by regex, so the guard must NEVER run there — firing it on JS pushed
// agents to degrade code to dodge it. A per-extension gate beats a tsconfig gate: it keeps a
// mixed project's .js edits safe while still checking its .ts/.tsx files.
const TS_EXT = /\.(ts|tsx)$/;
const CONTRACT_PATH_RE = /\/(interfaces?|types?)\/|\.(interface|types?)\.(ts|tsx)$/;
const EXPORTED_ANY_RE = /export\s+(async\s+)?function\s+\w+\s*\([^)]*:\s*any\b/;
const INLINE_OBJECT_RE = /:\s*\{[^{}\n;]+[;:][^{}\n;]+[;:][^{}\n]*\}/;
const ANY_RE = /\bany\[\]|\bArray<any>\b|:\s*any\b/g;
const TYPE_DECL_RE = /^\s*(export\s+)?(interface|type)\s+[A-Z]\w*/m;

/**
 * Return a violation message when contracts should be separated, else "".
 * @param filePath - File path being written.
 * @param content - Added content.
 * @returns Violation message or empty string (mirrors contract_violation).
 */
export function contractViolation(filePath: string, content: string): string {
  if (!TS_EXT.test(filePath) || CONTRACT_PATH_RE.test(filePath)) return "";
  if (TYPE_DECL_RE.test(content)) {
    return "Named interface/type declared outside a contract file. Move it to *.interface.ts or *.types.ts.";
  }
  if (EXPORTED_ANY_RE.test(content)) {
    return "Exported function uses any. Move request/response contracts to *.interface.ts or *.types.ts.";
  }
  if (INLINE_OBJECT_RE.test(content)) {
    return "Inline object type with multiple fields. Move the contract to *.interface.ts or *.types.ts.";
  }
  if ((content.match(ANY_RE) ?? []).length >= 2) {
    return "Multiple any annotations. Define named contracts in *.interface.ts or *.types.ts.";
  }
  return "";
}
