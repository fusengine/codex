# fusengine-codex env loader
# Auto-installed by fusengine-codex setup.ps1
# Loads %USERPROFILE%\.codex\.env on every PowerShell session.

$EnvFile = Join-Path $HOME ".codex\.env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*export\s+([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
        }
    }
}
