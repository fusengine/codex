#!/bin/bash
# fusengine-codex — Load API keys from ~/.codex/.env
# Add to ~/.bashrc: source /path/to/codex-env.bash

if [ -f ~/.codex/.env ]; then
    set -a
    . ~/.codex/.env
    set +a
fi
