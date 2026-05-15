# fusengine-codex env loader
# Auto-installed by fusengine-codex setup.sh
# Source ~/.codex/.env on every interactive bash/zsh session.

if [ -f "$HOME/.codex/.env" ]; then
    set -a
    . "$HOME/.codex/.env"
    set +a
fi
