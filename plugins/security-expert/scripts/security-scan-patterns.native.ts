/**
 * security-scan-patterns.native.ts — native TS port of
 * _legacy_py/security_scan_patterns.py. Per-language scan patterns as
 * [severity, category, pattern, glob] tuples. Data-only; imported (and inlined)
 * by security-scan.native.ts. Patterns are byte-identical to the Python.
 */

/** One scan pattern: [severity, category, regex-string, include-glob]. */
export type ScanPattern = [string, string, string, string];

const PATTERNS: Record<string, ScanPattern[]> = {
  javascript: [
    ["HIGH", "XSS", "innerHTML\\s*=", "*.js"],
    ["HIGH", "XSS", "dangerouslySetInnerHTML", "*.js"],
    ["CRITICAL", "CODE_EXEC", "eval(", "*.js"],
    ["CRITICAL", "CODE_EXEC", "new Function(", "*.js"],
    ["CRITICAL", "CMD_INJECTION", "child_process", "*.js"],
    ["HIGH", "CMD_INJECTION", "shell:\\s*true", "*.js"],
    ["MEDIUM", "WEAK_CRYPTO", "Math\\.random()", "*.js"],
    ["CRITICAL", "SECRETS", "AKIA[0-9A-Z]\\{16\\}", "*.js"],
  ],
  php: [
    ["CRITICAL", "RCE", "shell_exec\\|system(\\|passthru(", "*.php"],
    ["CRITICAL", "CODE_EXEC", "eval(\\|assert(", "*.php"],
    ["HIGH", "SQL_INJECTION", "mysql_query(", "*.php"],
  ],
  python: [
    ["CRITICAL", "CODE_EXEC", "eval(\\|exec(", "*.py"],
    ["CRITICAL", "CMD_INJECTION", "os\\.system(\\|subprocess.*shell=True", "*.py"],
    ["HIGH", "DESERIALIZATION", "pickle\\.loads(", "*.py"],
    ["HIGH", "TLS", "verify=False\\|ssl\\.CERT_NONE", "*.py"],
  ],
  swift: [
    ["HIGH", "INSECURE_STORAGE", "UserDefaults.*password\\|token\\|secret", "*.swift"],
    ["MEDIUM", "INSECURE_HTTP", '"http://', "*.swift"],
    ["HIGH", "WEAK_KEYCHAIN", "kSecAttrAccessibleAlways", "*.swift"],
  ],
};

/**
 * Return scan patterns for a language (mirrors get_patterns).
 * @param lang - Language key; unknown → [].
 */
export function getPatterns(lang: string): ScanPattern[] {
  return PATTERNS[lang] ?? [];
}
