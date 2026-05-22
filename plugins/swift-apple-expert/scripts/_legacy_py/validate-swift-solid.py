#!/usr/bin/env python3
"""PostToolUse hook - SOLID validation for Swift/SwiftUI."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
try:
    from edit_targets import iter_edit_targets
    from validate_solid_common import count_code_lines, deny_solid_violation
    from hook_output import allow_pass
except ImportError:
    sys.exit(0)


def main():
    """Validate Swift SOLID principles after Write/Edit."""
    data = json.load(sys.stdin)
    for target in iter_edit_targets(data):
        file_path = target.get("file_path", "")
        if not file_path.endswith(".swift"):
            continue
        if re.search(r"/(\.build|DerivedData|Pods)/", file_path):
            continue

        content = target.get("content", "")
        if not content:
            continue

        line_count = count_code_lines(content)
        max_lines = 150 if re.search(r"(View|Screen)\.swift$", file_path) else 100
        violations = []

        if line_count > max_lines:
            violations.append(
                f"File has {line_count} lines (limit: {max_lines}). "
                "Extract to ViewModels, Services, or subviews."
            )

        if re.search(r"^protocol ", content, re.MULTILINE):
            if "/Protocols/" not in file_path:
                violations.append("Protocol defined outside Protocols/ directory.")

        if file_path.endswith("ViewModel.swift"):
            if "@MainActor" not in content:
                violations.append("ViewModel missing @MainActor annotation.")

        if re.search(r"^(class|struct) .* \{", content, re.MULTILINE):
            if "async " in content and "Sendable" not in content:
                violations.append("Type uses async but doesn't conform to Sendable.")

        if violations:
            deny_solid_violation(file_path, violations)

    allow_pass("validate-swift-solid", "SOLID ok")


if __name__ == "__main__":
    main()
