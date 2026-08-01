#!/bin/bash
# fusengine-codex — Auto-detect shell and install ~/.codex/.env loader
# Supports: macOS, Linux, WSL, Git Bash. For native PowerShell: install-env.ps1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$HOME/.codex/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*) grep -qi microsoft /proc/version 2>/dev/null && echo "wsl" || echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows-bash" ;;
        *) echo "unknown" ;;
    esac
}

detect_user_shell() {
    case "$1" in
        macos) dscl . -read "/Users/$USER" UserShell 2>/dev/null | awk '{print $2}' | xargs basename ;;
        linux|wsl) getent passwd "$USER" 2>/dev/null | cut -d: -f7 | xargs basename || echo "bash" ;;
        windows-bash) echo "bash" ;;
        *) echo "unknown" ;;
    esac
}

install_posix() {
    local shell="$1" rc="$2"
    touch "$rc" 2>/dev/null || true
    if grep -q "fusengine-codex — Load API keys" "$rc" 2>/dev/null; then
        echo -e "  ${YELLOW}$shell: Already installed${NC}"; return 0
    fi
    # FUSE_* are skipped on purpose: per-harness vars (refs dirs, marketplaces,
    # SOLID ceiling, TTLs) exported globally leak Codex's values into
    # Claude/Kimi, whose harness never overwrites an already-set key.
    cat >> "$rc" <<'EOF'

# fusengine-codex — Load API keys
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
EOF
    echo -e "  ${GREEN}$shell: Installed ($rc)${NC}"
}

install_fish() {
    local dir="$HOME/.config/fish/conf.d" file
    file="$dir/codex-env.fish"
    mkdir -p "$dir"
    [[ -f "$file" ]] && { echo -e "  ${YELLOW}fish: Already installed${NC}"; return 0; }
    cp "$SCRIPT_DIR/codex-env.fish" "$file"
    echo -e "  ${GREEN}fish: Installed ($file)${NC}"
}

install_powershell() {
    local dir file
    if [[ -n "$USERPROFILE" ]]; then dir="$USERPROFILE/Documents/PowerShell"
    else dir="$HOME/.config/powershell"; fi
    file="$dir/Microsoft.PowerShell_profile.ps1"
    mkdir -p "$dir" 2>/dev/null || true
    if [[ -f "$file" ]] && grep -q "codex" "$file" 2>/dev/null; then
        echo -e "  ${YELLOW}powershell: Already installed${NC}"; return 0
    fi
    cat >> "$file" <<'PWSH'

# fusengine-codex — Load API keys
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$codexEnvFile = Join-Path $codexHome ".env"
if (Test-Path $codexEnvFile) {
    Get-Content $codexEnvFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        $line = $line -replace '^\s*export\s+', ''
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
            $name = $Matches[1]
            # FUSE_* are PER-HARNESS: set globally they leak Codex's values into
            # Claude/Kimi, whose harness never overwrites an already-set key.
            if ($name -like 'FUSE_*') { return }
            $value = ($Matches[2] -replace '\s+#.*$', '').Trim()
            $value = $value.Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}
PWSH
    echo -e "  ${GREEN}powershell: Installed ($file)${NC}"
}

bootstrap_env_file() {
    [[ -f "$ENV_FILE" ]] && { echo -e "${GREEN}$ENV_FILE exists${NC}"; return; }
    echo -e "${YELLOW}$ENV_FILE does not exist${NC}"
    if [[ -f "$ENV_EXAMPLE" ]]; then
        mkdir -p "$(dirname "$ENV_FILE")"
        sed 's/^[[:space:]]*\([A-Z_][A-Z0-9_]*\)=/export \1=/g' "$ENV_EXAMPLE" > "$ENV_FILE"
        echo -e "${GREEN}Created $ENV_FILE from .env.example${NC}"
    else
        echo -e "${RED}.env.example not found${NC}"
    fi
}

echo -e "${BLUE}fusengine-codex — Environment Installer${NC}"
OS=$(detect_os); USER_SHELL=$(detect_user_shell "$OS")
echo -e "OS: ${BLUE}$OS${NC}  Shell: ${BLUE}$USER_SHELL${NC}"
bootstrap_env_file
echo "Installing for $USER_SHELL..."
case "$USER_SHELL" in
    bash) install_posix "bash" "$HOME/.bashrc" ;;
    zsh)  install_posix "zsh"  "$HOME/.zshrc"  ;;
    fish) install_fish ;;
    pwsh|powershell) install_powershell ;;
    *) install_posix "bash" "$HOME/.bashrc" ;;
esac
echo -e "${GREEN}Done.${NC} Restart your terminal."
