# fusengine-codex — Environment Installer for Windows PowerShell
# Run: .\install-env.ps1

$ErrorActionPreference = "Stop"

Write-Host "fusengine-codex — Environment Installer (PowerShell)" -ForegroundColor Blue
Write-Host "─────────────────────────────────────────────────"
Write-Host ""

$envFile = "$HOME\.codex\.env"
$profileDir = Split-Path $PROFILE -Parent
$profileFile = $PROFILE

if (-not (Test-Path $envFile)) {
    Write-Host "Warning: $envFile does not exist" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create it with your API keys:"
    Write-Host "  New-Item -ItemType Directory -Force -Path `"$HOME\.codex`""
    Write-Host "  @'"
    Write-Host "  export CONTEXT7_API_KEY=`"ctx7sk-xxx`""
    Write-Host "  export EXA_API_KEY=`"xxx`""
    Write-Host "  export GEMINI_API_KEY=`"xxx`""
    Write-Host "  '@ | Set-Content `"$envFile`""
    Write-Host ""
}

if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
    Write-Host "  Created: $profileDir" -ForegroundColor Green
}

if ((Test-Path $profileFile) -and (Select-String -Path $profileFile -Pattern "codex" -Quiet)) {
    Write-Host "  PowerShell: Already installed" -ForegroundColor Yellow
} else {
    $loaderScript = @'

# fusengine-codex — Load API keys from ~/.codex/.env
$codexEnvFile = "$HOME\.codex\.env"
if (Test-Path $codexEnvFile) {
    Get-Content $codexEnvFile | ForEach-Object {
        if ($_ -match '^export\s+(\w+)=["\x27]?([^"\x27]*)["\x27]?$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}
'@
    Add-Content -Path $profileFile -Value $loaderScript
    Write-Host "  PowerShell: Installed ($profileFile)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Ensure $envFile exists with your API keys"
Write-Host "  2. Restart PowerShell or run: . `$PROFILE"
