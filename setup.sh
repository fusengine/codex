#!/bin/bash
# Fusengine Codex Plugins - Quick Setup
set -e
cd "$(dirname "$0")"
bun install
bun run scripts/install-codex.ts "$@"
