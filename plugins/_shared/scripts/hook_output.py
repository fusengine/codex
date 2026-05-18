"""Shared Codex hook output helpers."""
import json
from hook_log import log_hook, summary


def emit_pre_tool(decision, reason, context=None, script_name=None):
    """Emit PreToolUse hookSpecificOutput JSON to stdout.

    Args:
        decision: 'allow' or 'deny'.
        reason: Shown to Codex as the hook decision reason.
        context: Optional additionalContext visible to Claude.
        script_name: Optional hook name for systemMessage + hook log.
    """
    output = {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": reason,
    }
    if context:
        output["additionalContext"] = context
    payload = {"hookSpecificOutput": output}
    if script_name:
        payload["systemMessage"] = f"{script_name}: {summary(reason)}"
        log_hook(script_name, f"{decision}: {summary(reason)}")
    print(json.dumps(payload))


def emit_post_tool(context, script_name=None):
    """Emit PostToolUse hookSpecificOutput JSON to stdout.

    Args:
        context: additionalContext string visible to Claude.
    """
    payload = {"hookSpecificOutput": {
        "hookEventName": "PostToolUse",
        "additionalContext": context,
    }}
    if script_name:
        payload["systemMessage"] = f"{script_name}: {summary(context)}"
        log_hook(script_name, f"post: {summary(context)}")
    print(json.dumps(payload))


def allow_pass(script_name, detail="pass"):
    """Output PreToolUse allow with systemMessage for user visibility."""
    log_hook(script_name, f"allow: {detail}")
    print(json.dumps({
        "systemMessage": f"{script_name}: {detail}",
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow",
        },
    }))


def post_pass(script_name, detail="ok"):
    """Output PostToolUse success with systemMessage for user visibility."""
    log_hook(script_name, f"post: {detail}")
    print(json.dumps({
        "systemMessage": f"{script_name}: {detail}",
        "hookSpecificOutput": {"hookEventName": "PostToolUse"},
    }))
