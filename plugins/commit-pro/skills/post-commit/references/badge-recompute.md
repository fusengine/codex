# Badge Recompute

Load during the marketplace path when README badges must be recomputed. Never hand-maintain counts.

```bash
PLUGINS=$(grep -cE '"path": "\./plugins/' .agents/plugins/marketplace.json)
AGENTS=$(find plugins -path '*/agents/*.toml' -type f | wc -l | tr -d ' ')
SKILLS=$(find plugins -path '*/skills/*/SKILL.md' -type f | wc -l | tr -d ' ')
```

Update only the numeric/version token in each existing shields.io badge: suite version, plugins, agents, and skills. Re-run the counts immediately before writing the CHANGELOG or commit message; do not reuse sampled or remembered numbers.
