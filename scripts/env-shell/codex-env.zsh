#!/bin/zsh
# fusengine-codex — Load API keys from ${CODEX_HOME:-~/.codex}/.env
# Add to ~/.zshrc: source /path/to/codex-env.zsh
#
# Parsed line by line instead of sourced with `set -a`, because FUSE_* must NOT
# be exported: those are PER-HARNESS (refs dirs, marketplaces, SOLID ceiling,
# TTLs). Exported globally they leak Codex's values into Claude/Kimi, whose
# harness never overwrites an already-set key — each harness loads its own
# <home>/.env directly, so it must not inherit Codex's.

_codex_home="${CODEX_HOME:-$HOME/.codex}"
_codex_env_file="$_codex_home/.env"

if [ -f "$_codex_env_file" ]; then
    while IFS= read -r _codex_line || [ -n "$_codex_line" ]; do
        case "$_codex_line" in "" | "#"*) continue ;; esac
        _codex_line="${_codex_line#export }"
        case "$_codex_line" in [A-Za-z_]*=*) ;; *) continue ;; esac
        _codex_key="${_codex_line%%=*}"
        case "$_codex_key" in FUSE_*) continue ;; esac
        _codex_val="${_codex_line#*=}"
        case "$_codex_val" in
            \"*\") _codex_val="${_codex_val#\"}"; _codex_val="${_codex_val%\"}" ;;
            \'*\') _codex_val="${_codex_val#\'}"; _codex_val="${_codex_val%\'}" ;;
            *" #"*) _codex_val="${_codex_val%% #*}" ;;
        esac
        export "$_codex_key=$_codex_val"
    done <"$_codex_env_file"
fi

unset _codex_home _codex_env_file _codex_line _codex_key _codex_val
