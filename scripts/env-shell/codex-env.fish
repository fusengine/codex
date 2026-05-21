# fusengine-codex env loader
# Auto-installed by fusengine-codex setup.sh
# Loads {$CODEX_HOME:-~/.codex}/.env into the current fish process.

set -q CODEX_HOME; or set -gx CODEX_HOME "$HOME/.codex"
set -l codex_env_file "$CODEX_HOME/.env"

if test -f "$codex_env_file"
    for line in (string split \n (cat "$codex_env_file"))
        set line (string trim "$line")
        if test -z "$line"; or string match -qr '^\s*#' "$line"
            continue
        end
        set line (string replace -r '^\s*export\s+' '' "$line")
        if not string match -qr '^[A-Za-z_][A-Za-z0-9_]*=' "$line"
            continue
        end
        set -l key (string split -m1 '=' "$line")[1]
        set -l val (string split -m1 '=' "$line")[2]
        set val (string trim "$val")
        set val (string replace -r '\s+#.*$' '' "$val")
        set val (string trim -c '"' "$val")
        set val (string trim -c "'" "$val")
        set -gx "$key" "$val"
    end
end
