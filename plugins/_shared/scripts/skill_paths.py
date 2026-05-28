#!/usr/bin/env python3
"""Version-resolved paths to plugin skills in the Codex cache.

The cache nests skills under a version dir (<plugin>/<version>/skills/<skill>/),
so a hardcoded <plugin>/skills/... path does not exist and a deny hint would
point the agent at a missing file. This resolves the latest version segment.
"""
import os

PLUGINS_DIR = os.path.expanduser("~/.codex/plugins/cache/fusengine-codex")


def _semver_key(version: str) -> tuple:
    """Sort key for semantic versions (1.10.0 > 1.2.5, not lexicographic)."""
    return tuple(int(p) if p.isdigit() else 0 for p in version.split("."))


def skill_md(plugin: str, skill: str) -> str:
    """Return the version-resolved path to <plugin>/skills/<skill>/SKILL.md."""
    root = os.path.join(PLUGINS_DIR, plugin)
    rest = os.path.join("skills", skill, "SKILL.md")
    direct = os.path.join(root, rest)
    if os.path.isfile(direct):
        return direct
    try:
        versions = [v for v in os.listdir(root)
                    if os.path.isfile(os.path.join(root, v, rest))]
    except OSError:
        return direct
    return os.path.join(root, max(versions, key=_semver_key), rest) if versions else direct
