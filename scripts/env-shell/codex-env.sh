# fusengine-codex env loader
# Auto-installed by fusengine-codex setup.sh
# Loads ${CODEX_HOME:-$HOME/.codex}/.env into the current shell process.

_codex_home="${CODEX_HOME:-$HOME/.codex}"
_codex_env_file="$_codex_home/.env"

if [ -f "$_codex_env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$_codex_env_file"
    set +a
fi

unset _codex_home _codex_env_file
