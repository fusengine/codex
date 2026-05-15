# Fusengine Codex Plugins - Quick Setup for Windows
# Run: .\setup.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Fusengine Codex Plugins Setup (Windows)" -ForegroundColor Cyan

# Check Bun
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "Bun not found. Install from https://bun.sh" -ForegroundColor Red
    exit 1
}

# Check codex CLI (optional but recommended)
if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
    Write-Host "codex CLI not found in PATH (installer will fall back to config.toml patch)" -ForegroundColor Yellow
}

Push-Location $ScriptDir
try {
    bun install
    bun run scripts/install-codex.ts $args
} finally {
    Pop-Location
}
