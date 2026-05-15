# fusengine-codex env loader
# Auto-installed by fusengine-codex setup.sh
# Sources ~/.codex/.env on every interactive fish session.

if test -f ~/.codex/.env
    for line in (grep '^export' ~/.codex/.env)
        set -l keyval (string replace 'export ' '' $line)
        set -l key (string split -m1 '=' $keyval)[1]
        set -l val (string split -m1 '=' $keyval)[2]
        set val (string trim -c '"' $val)
        set val (string trim -c "'" $val)
        set -gx $key $val
    end
end
