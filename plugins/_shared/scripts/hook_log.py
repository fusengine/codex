"""Shared hook log helpers."""
import os
from datetime import datetime, timezone


def codex_home():
    """Return CODEX_HOME or the default ~/.codex path."""
    return os.environ.get("CODEX_HOME") or os.path.join(
        os.path.expanduser("~"), ".codex")


def hook_log_path():
    """Return the Fusengine hook log path."""
    return os.path.join(codex_home(), "fusengine", "logs", "hooks.log")


def summary(text):
    """Return a one-line hook message for user-visible status."""
    first = str(text).splitlines()[0] if text else "hook event"
    return first[:180]


def log_hook(script_name, detail):
    """Append a hook event without masking the hook decision."""
    try:
        path = hook_log_path()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        stamp = datetime.now(timezone.utc).isoformat()
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(f"{stamp} {script_name}: {detail}\n")
    except OSError:
        pass
