#!/usr/bin/env python3
"""Shared contract-separation checks for typed source files."""
import re

TS_EXT = r'\.(ts|tsx|js|jsx)$'
CONTRACT_PATH_RE = re.compile(r'/(interfaces?|types?)/|\.(interface|types?)\.(ts|tsx)$')
EXPORTED_ANY_RE = re.compile(r'export\s+(async\s+)?function\s+\w+\s*\([^)]*:\s*any\b')
INLINE_OBJECT_RE = re.compile(r':\s*\{[^{}\n;]+[;:][^{}\n;]+[;:][^{}\n]*\}')
ANY_RE = re.compile(r'\bany\[\]|\bArray<any>\b|:\s*any\b')
TYPE_DECL_RE = re.compile(r'^\s*(export\s+)?(interface|type)\s+[A-Z]\w*', re.MULTILINE)


def contract_violation(file_path: str, content: str) -> str:
    """Return a violation message when contracts should be separated."""
    if not re.search(TS_EXT, file_path) or CONTRACT_PATH_RE.search(file_path):
        return ""
    if TYPE_DECL_RE.search(content):
        return "Named interface/type declared outside a contract file. Move it to *.interface.ts or *.types.ts."
    if EXPORTED_ANY_RE.search(content):
        return "Exported function uses any. Move request/response contracts to *.interface.ts or *.types.ts."
    if INLINE_OBJECT_RE.search(content):
        return "Inline object type with multiple fields. Move the contract to *.interface.ts or *.types.ts."
    if len(ANY_RE.findall(content)) >= 2:
        return "Multiple any annotations. Define named contracts in *.interface.ts or *.types.ts."
    return ""
