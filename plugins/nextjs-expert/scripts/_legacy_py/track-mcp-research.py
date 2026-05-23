#!/usr/bin/env python3
"""track-mcp-research.py - Track MCP research calls for nextjs-expert."""

import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
from tracking import track_mcp_research


def main() -> None:
    """Main entry point."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    if not re.match(r"^mcp__", tool_name):
        sys.exit(0)

    tool_input = data.get("tool_input") or {}
    query = tool_input.get("query") or tool_input.get("topic") or ""
    if not query:
        sys.exit(0)

    session_id = data.get("session_id") or f"fallback-{os.getpid()}"
    source = "mcp"
    if "context7" in tool_name:
        source = "context7"
    elif "exa" in tool_name:
        source = "exa"

    track_mcp_research(source, tool_name, query, session_id)
    sys.exit(0)


if __name__ == "__main__":
    main()
