#!/usr/bin/env python3
"""track-doc-helpers.py - Helper functions for doc consultation tracking."""

import os
import re
import sys
import time
from typing import Optional, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(
    os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
from shell_read_paths import skill_doc_path_from_payload  # pylint: disable=wrong-import-position


def detect_framework(query: str) -> str:
    """Detect framework from query string."""
    for pattern, fw in [
        (r"(next|nextjs|Next)", "nextjs"),
        (r"(react|React)", "react"),
        (r"(laravel|Laravel|php|PHP)", "laravel"),
        (r"(swift|Swift|swiftui|SwiftUI)", "swift"),
        (r"(tailwind|Tailwind)", "tailwind"),
        (r"(java|Java|spring|Spring)", "java"),
        (r"\b(go|Go|golang)\b", "go"),
        (r"(ruby|Ruby|rails|Rails)", "ruby"),
        (r"(rust|Rust|cargo|Cargo)", "rust"),
    ]:
        if re.search(pattern, query):
            return fw
    return "generic"


def acquire_state_lock(lock_dir: str, max_wait: int = 5) -> bool:
    """Acquire lock via mkdir (atomic POSIX)."""
    waited = 0
    while True:
        try:
            os.mkdir(lock_dir)
            return True
        except FileExistsError:
            time.sleep(0.1)
            waited += 1
            if waited > max_wait * 10:
                return False


def extract_tool_info(data: dict) -> Optional[Tuple[str, str, str]]:
    """Extract source, query, tool from hook data. Returns None to skip."""
    tool = data.get("tool_name", "")
    if "context7" in tool:
        q = (data.get("tool_input", {}).get("libraryId")
             or data.get("tool_input", {}).get("libraryName", ""))
        return "context7", q, tool
    if "exa" in tool:
        return "exa", data.get("tool_input", {}).get("query", ""), tool
    if tool == "Read":
        fp = data.get("tool_input", {}).get("file_path", "")
        if not re.search(r"skills/.*\.md$", fp):
            return None
        return "skill", fp, tool
    fp = skill_doc_path_from_payload(data)
    if fp and re.search(r"skills/.*\.(md|txt)$", fp):
        return "skill", fp, tool
    return None
