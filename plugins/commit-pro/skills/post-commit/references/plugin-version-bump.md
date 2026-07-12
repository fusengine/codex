# Plugin Version Bump

For every modified plugin detected by the marketplace path:

1. Read `plugins/{name}/.codex-plugin/plugin.json`.
2. Increment its PATCH version.
3. Update the matching entry under `.agents/plugins/marketplace.json` when that entry carries a version.
4. Core entries without a marketplace version update only their local plugin manifest.

Read and write JSON structurally. Re-read the final values before preparing the CHANGELOG claim.
