/**
 * security-rules.ts — bundle-safe TS port of _shared/scripts/security_rules.py.
 * Command validation for the security-guard PreToolUse hook. Every command,
 * pattern and violation string is verbatim from the Python for strict parity.
 */

/** Commands that are always critical/destructive. */
const CRITICAL_COMMANDS = ["del", "mkfs", "shred", "dd if=", "fdisk", "diskutil erase", "diskutil eraseDisk"];

/** Privilege-escalation commands. */
const PRIVILEGE_COMMANDS = ["sudo", "su", "doas", "passwd"];

/** Catastrophic shell patterns (case-insensitive, verbatim from Python). */
const DANGEROUS_PATTERNS = [
  /rm\s+.*-rf\s*\/\s*$/i,
  /rm\s+.*-rf\s*\/etc/i,
  /rm\s+.*-rf\s*\/usr/i,
  /rm\s+.*-rf\s*\/var/i,
  /rm\s+.*-rf\s*\/bin/i,
  /rm\s+.*-rf\s*\/sbin/i,
  />\s*\/dev\/(sda|hda|nvme)/i,
  /curl\s+.*\|\s*(sh|bash|zsh)/i,
  /wget\s+.*-O\s*-\s*\|\s*(sh|bash)/i,
];

/** Source pattern strings for DANGEROUS_PATTERNS, matching Python `.pattern`. */
const DANGEROUS_PATTERN_SRC = [
  "rm\\s+.*-rf\\s*/\\s*$",
  "rm\\s+.*-rf\\s*/etc",
  "rm\\s+.*-rf\\s*/usr",
  "rm\\s+.*-rf\\s*/var",
  "rm\\s+.*-rf\\s*/bin",
  "rm\\s+.*-rf\\s*/sbin",
  ">\\s*/dev/(sda|hda|nvme)",
  "curl\\s+.*\\|\\s*(sh|bash|zsh)",
  "wget\\s+.*-O\\s*-\\s*\\|\\s*(sh|bash)",
];

/**
 * Extract the command part preceding a heredoc body, mirroring Python's
 * extract_command_part.
 * @param command - Raw shell command string.
 * @returns The command portion to validate.
 */
export function extractCommandPart(command: string): string {
  const match = command.match(/^([^<]*<<\s*['"]?(\w+)['"]?)/);
  return match ? match[1]! : command;
}

/**
 * Validate a command against the security rules.
 * @param command - Raw shell command string.
 * @returns Tuple of (isValid, violations) matching validate_command.
 */
export function validateCommand(command: string): [boolean, string[]] {
  const violations: string[] = [];
  const cmd = extractCommandPart(command);
  const tokens = cmd.split(/[\s|;&]+/).filter(Boolean);

  for (const critical of CRITICAL_COMMANDS) {
    if (tokens.some((t) => t === critical || t.startsWith(critical + " "))) {
      violations.push(`CRITICAL: Detected dangerous command '${critical}'`);
    }
  }
  DANGEROUS_PATTERNS.forEach((pattern, i) => {
    if (pattern.test(cmd)) violations.push(`DANGEROUS PATTERN: ${DANGEROUS_PATTERN_SRC[i]}`);
  });
  if (/\brm\s+/.test(cmd) && !/trash/i.test(cmd)) {
    violations.push("DELETE: 'rm' permanently deletes - confirmation required");
  }
  if (/\bunlink\s+/.test(cmd)) {
    violations.push("DELETE: 'unlink' command detected - confirmation required");
  }
  for (const priv of PRIVILEGE_COMMANDS) {
    if (new RegExp(`(^|\\s|;|\\||&)${priv}(\\s|$|;|\\||&)`, "i").test(cmd)) {
      violations.push(`PRIVILEGE ESCALATION: ${priv}`);
    }
  }
  return [violations.length === 0, violations];
}
