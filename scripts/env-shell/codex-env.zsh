#!/bin/zsh
# fusengine-codex — Load API keys from ${CODEX_HOME:-~/.codex}/.env
# Add to ~/.zshrc: source /path/to/codex-env.zsh

_codex_home="${CODEX_HOME:-$HOME/.codex}"
_codex_env_file="$_codex_home/.env"

if [[ -f "$_codex_env_file" ]]; then
    set -a
    . "$_codex_env_file"
    set +a
fi

unset _codex_home _codex_env_file
