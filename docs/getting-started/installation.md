# Installation

## Prerequisites

- **Codex CLI / Codex app**
- **Bun** - install from [bun.sh](https://bun.sh)

## 1. Add Marketplace

When the installed Codex CLI supports plugin marketplace commands:

```bash
codex plugin marketplace add https://github.com/fusengine/codex.git
```

## 2. Install Plugins

Install the required Fusengine plugins with the Codex plugin command when
available:

```bash
codex plugin add ai-pilot@fusengine-codex
codex plugin add codex-rules@fusengine-codex
```

If the local CLI does not support plugin installation yet, run the marketplace
checkout installer. It caches local plugin bundles and enables them in Codex
config.

## 3. Run Setup

### macOS / Linux

```bash
~/.codex/.tmp/marketplaces/fusengine-codex/setup.sh
```

### Windows

```powershell
~/.codex/.tmp/marketplaces/fusengine-codex/setup.ps1
```

The setup writes configuration under `${CODEX_HOME:-~/.codex}` and installs:

- Codex feature flags for hooks and plugin hooks
- plugin cache entries under `~/.codex/plugins/cache/`
- AGENTS.md rules
- optional MCP configuration
- shell environment helpers

## 4. Enable Plugin Hooks

The installer should set these flags automatically:

```toml
[features]
hooks = true
plugin_hooks = true
```

Manual configuration lives in:

```bash
${CODEX_HOME:-$HOME/.codex}/config.toml
```

## 5. Verify Installation

```bash
codex features list | rg 'hooks|plugin_hooks'
bun run validate
```

Expected:

- `hooks` enabled
- `plugin_hooks` enabled
- validation passes

## Manual API Keys

If you skipped API keys during setup, configure the environment expected by the
MCP server you enabled, then restart Codex.

Common keys:

```bash
export CONTEXT7_API_KEY="ctx7sk-xxx"
export EXA_API_KEY="xxx"
export MAGIC_API_KEY="xxx"
export GEMINI_DESIGN_API_KEY="xxx"
```

## Troubleshooting

### Bun Not Found

```bash
curl -fsSL https://bun.sh/install | bash
```

### Hooks Not Working

```bash
codex features list | rg 'hooks|plugin_hooks'
bun run validate
```

### Check Config

```bash
sed -n '/\\[features\\]/,/^\\[/p' "${CODEX_HOME:-$HOME/.codex}/config.toml"
```
