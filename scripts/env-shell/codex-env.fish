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
        # FUSE_* are PER-HARNESS (refs dirs, marketplaces, SOLID ceiling, TTLs).
        # Exported globally they leak Codex's values into Claude/Kimi, whose
        # harness never overwrites an already-set key — each harness loads its
        # own <home>/.env directly, so it must not inherit Codex's.
        if string match -q 'FUSE_*' "$key"
            continue
        end
        set -l val (string split -m1 '=' "$line")[2]
        set val (string trim "$val")
        set val (string replace -r '\s+#.*$' '' "$val")
        set val (string trim -c '"' "$val")
        set val (string trim -c "'" "$val")
        set -gx "$key" "$val"
    end
end
