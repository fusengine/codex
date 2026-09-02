---
name: hook-scripts-reference-2
description: Check-logic reference scripts (Swift SOLID, skill-read tracker) — continued from hook-scripts-reference.md
keywords: hooks, scripts, bash, validation, solid, reference, swift
---

# Hook Scripts — Check-Logic Reference (continued)

Continued from `hook-scripts-reference.md` (split to stay under the `FUSE_SOLID_MAX_LINES` ceiling). Read `hook-scripts.md` first: neither script below is directly wireable in this Codex marketplace — port its logic into a `plugins/<plugin>/scripts/<event-kebab>/<name>.native.ts` file (`// @hook-entry`, stdin JSON in, `permissionDecision` JSON out, always `exit 0`).

---

## Swift SOLID Validation — File: scripts/validate-swift-solid.sh

```bash
#!/bin/bash
# Swift SOLID Validation
# Protocols in Sources/Interfaces/

set -e

FILE_PATH="${1:-}"
MAX_LINES=100

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Only check Swift files
case "$FILE_PATH" in
    *.swift)
        ;;
    *)
        exit 0
        ;;
esac

# Check file size
if [ -f "$FILE_PATH" ]; then
    LINE_COUNT=$(wc -l < "$FILE_PATH" | tr -d ' ')

    if [ "$LINE_COUNT" -gt "$MAX_LINES" ]; then
        echo "ERROR: File exceeds $MAX_LINES lines ($LINE_COUNT lines)"
        echo "Split: ViewModel + View + Service"
        exit 1
    fi
fi

# Check protocol location
if grep -q "^protocol " "$FILE_PATH" 2>/dev/null; then
    if [[ "$FILE_PATH" != *"Sources/Interfaces/"* ]] && [[ "$FILE_PATH" != *"Protocols/"* ]]; then
        echo "ERROR: Protocols must be in Sources/Interfaces/"
        exit 1
    fi
fi

exit 0
```

---

## Skill Read Tracker — File: scripts/track-skill-read.sh

```bash
#!/bin/bash
# Track skill usage for analytics
# PostToolUse on Read

FILE_PATH="${1:-}"
LOG_FILE="${PLUGIN_ROOT:-/tmp}/skill-reads.log"

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Only track skill reads
if [[ "$FILE_PATH" == *"/skills/"* ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') READ: $FILE_PATH" >> "$LOG_FILE"
fi

exit 0
```
