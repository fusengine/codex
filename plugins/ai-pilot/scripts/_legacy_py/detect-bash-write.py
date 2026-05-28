"""
detect-bash-write.py — APEX PreToolUse hook

Blocks Bash commands that WRITE to a code file (`> x.ts`, `>> x.ts`, `tee x.ts`,
heredoc redirected into a code file) so the edit goes through the Write/Edit
tools, which enforce the APEX/SOLID documentation workflow.

Detection is tied to the redirection *target*. Pure reads (`head x.ts`,
`grep --include=*.ts`), file-descriptor redirects (`2>`, `&>`, `1>>`),
`>/dev/null` and a `>` appearing inside a quoted string are NOT blocked —
those previously produced false positives that made code files unreadable
via Bash.
"""
import json
import re
import sys


_CODE_EXT = r"(?:ts|tsx|js|jsx|py|php|swift|go|rs|rb|java|vue|svelte|astro|css)"

# Redirect (`>` / `>>`) whose target is a code file. The negative lookbehind
# drops fd redirects (`2>`, `&>`, `1>>`) and the second `>` of `>>`; the
# negative lookahead drops the `/dev/null` sink.
_REDIRECT_TO_CODE = re.compile(
    r"(?<![0-9&>])>>?\s*(?!/dev/null)['\"]?[\w./~$-]+\." + _CODE_EXT + r"\b"
)

# `tee [flags] x.ts` — tee writes its target even without a `>`.
_TEE_TO_CODE = re.compile(
    r"\btee\b(?:\s+-\S+)*\s+['\"]?[\w./~$-]+\." + _CODE_EXT + r"\b"
)

DENY_REASON = (
    "APEX BYPASS BLOCKED: Use Write tool instead of Bash to write code files. "
    "Write tool enforces APEX/SOLID documentation requirements."
)


def _strip_quoted(cmd: str) -> str:
    """Blank out single/double quoted spans so a `>` inside a string literal
    (e.g. `echo "a > b.ts"`) is not mistaken for a redirection."""
    out: list[str] = []
    quote: str | None = None
    for ch in cmd:
        if quote:
            out.append(" ")
            if ch == quote:
                quote = None
        elif ch in ("'", '"'):
            quote = ch
            out.append(" ")
        else:
            out.append(ch)
    return "".join(out)


def _writes_code_file(command: str) -> bool:
    """True only when the command redirects/tees output into a code file."""
    clean = _strip_quoted(command)
    return bool(_REDIRECT_TO_CODE.search(clean) or _TEE_TO_CODE.search(clean))


def _deny(reason: str) -> None:
    """Output a deny decision and exit cleanly."""
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))


def main() -> None:
    """Read PreToolUse event from stdin and block Bash code-file writes."""
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    if event.get("tool_name") not in ("Bash", "bash"):
        sys.exit(0)

    command: str = event.get("tool_input", {}).get("command", "")
    if command and _writes_code_file(command):
        _deny(DENY_REASON)

    sys.exit(0)


if __name__ == "__main__":
    main()
