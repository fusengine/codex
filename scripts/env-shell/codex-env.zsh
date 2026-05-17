#!/bin/zsh
# fusengine-codex — Load API keys from ~/.codex/.env
# Add to ~/.zshrc: source /path/to/codex-env.zsh

if [[ -f ~/.codex/.env ]]; then
    set -a
    . ~/.codex/.env
    set +a
fi
