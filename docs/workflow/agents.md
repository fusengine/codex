# Agents

37 specialized Codex agents across all plugins.

## Model Policy

The 37-agent policy (revised 2026-09-02, following a 15-run `codex exec`
0.152.1 benchmark comparing Terra medium, Terra high, Sol medium, Sol high,
and Luna max on bounded coding tasks — see "Benchmark 2026-09-02" below)
assigns model and effort by named role, not by the Claude source tier. The
12 framework/language experts, plus 3 high-volume read/search agents added
2026-09-02, now use `gpt-5.6-terra` / `medium` (15 total), the fastest and
cheapest tier at equal measured quality on bounded, briefed executor work;
15 other implementation, orchestration, and release specialists stay on
`gpt-5.6-sol` / `medium`; two judgment/gate roles use `gpt-5.6-sol` /
`high` (2); five bounded, strictly-contracted mechanical roles use
`gpt-5.6-luna` / `max` (5). Sol `xhigh` is retired fleet-wide as of
2026-09-02 (0 agents).

The exact groups are: Terra/medium — `astro-expert`, `go-expert`,
`laravel-expert`, `nextjs-expert`, `php-expert`, `react-expert`,
`rust-expert`, `shadcn-ui-expert`, `swift-expert`, `tailwindcss-expert`,
`tanstack-start-expert`, `typescript-expert`, `explore-codebase`,
`research-expert`, `websearch` (15); Sol/medium —
`brainstorming`, `solid-orchestrator`, `commit`, `changelog-watcher`,
`lessons-compactor`, `seo-expert`, `seo-content`, `seo-geo`, `seo-local`,
`seo-cluster`, `seo-technical`, `seo-schema`, `sniper`, `prompt-engineer`,
`challenger` (15); Sol/high — `security-expert`, `design-expert` (2);
Luna/max — `sniper-faster`, `commit-detector`,
`cartographer`, `seo-images`, `seo-sitemap` (5). Totals: 17 Sol, 15 Terra,
5 Luna. The coordinator (the owner's own Codex session) is not a shipped
agent TOML and stays outside this policy — Sol/high, unchanged.

Rationale: Codex 0.152.0's model catalog describes Sol as the frontier
agentic model, Terra as balanced-for-everyday-work, and Luna as fast/
affordable (no `ultra` effort on Luna; `ultra` itself means "maximum
reasoning with automatic task delegation" and is never used on a sub-agent).
The Artificial Analysis Intelligence Index (artificialanalysis.ai/models/
gpt-5-6-luna and the Sol launch article, July 2026): Sol low 51, Sol medium
56, Sol high 57, Sol xhigh 59, Luna max 52. Sol max is not used by any
shipped agent and is not asserted here (published figures diverge between
AA pages). Against the owner's 1-point
non-regression threshold: Sol medium↔high (56→57) is the only in-threshold
gap. Until 2026-09-02, `challenger` and `security-expert` were the two
remaining Sol/high judgment gates. `sniper` moved to Sol/medium on
2026-09-02 (owner decision): it validates code with tooling and tests,
where the benchmark showed medium equal to high. `prompt-engineer` —
previously a third Sol/high judgment gate — also moved to Sol/medium on
2026-09-02 (owner decision: "il est assez intelligent"), joining the
analysis/research/coordination roles below. Later the same day, owner
decision "seul le designer en high" moved `design-expert` from `xhigh`
(59) to `high` (57) and `challenger`/`security-expert` from `high` to
`medium`, retiring Sol `xhigh` fleet-wide; a same-day correction,
"security-expert en high", reinstated `security-expert` at `high` while
`challenger`'s move to `medium` stood. Current Sol/high (2): only
`security-expert` and `design-expert`. `seo-technical` and `seo-schema`
stay on Sol `medium` (56) — a move to Luna `max` (52) is a 4-point drop,
over threshold; being a bounded, deterministic, strict-contract task is
necessary but not sufficient for a Sol→Luna move, and the measured
regression vetoes it. `websearch` made the opposite move instead — see
below.

The 12 framework/language experts moved from Sol medium to Terra medium on
2026-09-02: the benchmark below found Terra medium equal to Sol medium on
measured quality (every run passed every hidden test on both tiers) while
finishing 1.7× faster at roughly half the token cost. The AA index does not
publish a directly comparable Terra score, so this move is evidence-based
on the benchmark, not the index. `commit` stays on Sol medium rather than
Terra because an irreversible git flow (write, tags, merges) is not the
bounded-executor shape the benchmark covered.
`brainstorming` and `solid-orchestrator` moved from Sol
high to Sol medium (57→56, -1): within threshold. `lessons-compactor`
moved from Luna max to Sol medium (52→56, +4): a strict quality increase,
not a regression risk, for a role needing long-horizon dedup/merge judgment
rather than a bounded mechanical task.

Later the same day (owner decision "passe en terra medium"), `research-expert`,
`websearch`, and `explore-codebase` moved from Sol/medium to Terra/medium,
joining the 12 framework experts. Unlike those 12, this move is NOT
covered by the 2026-09-02 benchmark below — that benchmark scored 3
bounded *coding* tasks only, while these three are high-volume read/search
agents (doc lookup, live web search, codebase exploration), a workload
shape the benchmark never measured. The known Terra risk below therefore
carries over unverified for this trio; it is mitigated procedurally by the
lead-orchestration relaunch rule (an empty or truncated research/
exploration report is relaunched immediately with the same brief, never
accepted as "nothing found" — see `plugins/ai-pilot/skills/
lead-orchestration/SKILL.md` and `plugins/codex-rules/rules/
03-agent-teams.md`).

Known risk on Terra, kept: openai/codex#32389 is still open in 0.152
("GPT-5.6 Terra intermittently returns an empty successful final response
after tool use, prematurely ending agent loops", reported at medium
effort) — not reproduced in 12 Terra runs across this benchmark. Mitigated
by doctrine, not by the tier choice: the coordinator checks every
deliverable on disk against the PRD, and challenger + sniper gate
acceptance, so the failure mode is a retry, never a silent bad merge. The
earlier field-report characterization of Terra as "worst of both worlds"
(burning Codex usage quota faster than Sol without a matching quality
gain) is kept for the record but was not reproduced by this benchmark.

### Benchmark 2026-09-02

15-run `codex exec` 0.152.1 benchmark: 3 bounded coding tasks (bug fix
against a documented contract; spec-driven feature; 3-file CLI change with
a byte-identical output constraint) × 5 configs, each run isolated
(`--ignore-user-config`, fresh directory, hidden tests copied in after the
run). Every run passed every hidden test, never altered a visible test.

| Task | Terra medium | Terra high | Sol medium | Sol high | Luna max |
|---|---|---|---|---|---|
| bug fix (7 hidden) | 7/7, 83s | 7/7, 65s | 7/7, 170s | 7/7, 151s | 7/7, 163s |
| spec feature (25 hidden) | 25/25, 48s | 25/25, 79s | 25/25, 82s | 25/25, 115s | 25/25, 124s |
| 3-file CLI (8 hidden) | 8/8, 79s | 8/8, 81s | 8/8, 101s | 8/8, 104s | 8/8, 140s |

Totals: Terra medium 210s, Sol medium 353s, Luna max 427s. Estimated
3-task cost (published per-1M-token pricing, input/cached/output — Sol
$4/$0.40/$20, Terra $2/$0.20/$12, Luna $0.20/$0.02/$1.20): Terra medium
$0.31, Sol medium $0.64, Luna max $0.04. A 6-run repeat of Terra medium on
the feature + CLI tasks passed 6/6, stable at 41-51s and 73-78s.

Every agent defines identity-based `nickname_candidates`; generic placeholder
pools are not valid defaults.

Every agent lists its relevant skills through `[[skills.config]]` entries that
point to installed cache `SKILL.md` files under
`/Users/<username>/.codex/plugins/cache/fusengine-codex/<plugin>/<version>/`.

## Inventory

| Plugin | Agents |
|--------|--------|
| `ai-pilot` | `brainstorming`, `explore-codebase`, `research-expert`, `sniper`, `sniper-faster`, `websearch` |
| `astro-expert` | `astro-expert` |
| `cartographer` | `cartographer` |
| `changelog-watcher` | `changelog-watcher` |
| `commit-pro` | `commit-detector` |
| `design-expert` | `design-expert` |
| `go-expert` | `go-expert` |
| `laravel-expert` | `laravel-expert` |
| `nextjs-expert` | `nextjs-expert` |
| `php-expert` | `php-expert` |
| `prompt-engineer` | `prompt-engineer` |
| `react-expert` | `react-expert` |
| `rust-expert` | `rust-expert` |
| `security-expert` | `security-expert` |
| `seo` | `seo-cluster`, `seo-content`, `seo-expert`, `seo-geo`, `seo-images`, `seo-local`, `seo-schema`, `seo-sitemap`, `seo-technical` |
| `shadcn-expert` | `shadcn-ui-expert` |
| `solid` | `solid-orchestrator` |
| `swift-apple-expert` | `swift-expert` |
| `tailwindcss` | `tailwindcss-expert` |
| `tanstack-start-expert` | `tanstack-start-expert` |
| `typescript-expert` | `typescript-expert` |

## Agent Teams

Agents can work in parallel when the active Codex runtime exposes a subagent or
team capability. Fusengine configures the Codex 0.144.1 native V2 tool under the
project-specific `fusengine_agents` namespace with spawn metadata visible. These are
runtime-proven internal knobs, not a stable public API. Keep file ownership
exclusive per teammate.

See [Agent Teams](agent-teams.md) for delegation rules, anti-patterns, and examples.

## Usage

Agents are launched automatically based on project detection, or manually:

```text
User: "Use nextjs-expert to fix the routing"
```

Or via the available subagent tool:

```typescript
fusengine_agents.spawn_agent({
  agent_type: "nextjs-expert",
  message: "Fix the routing issue",
  task_name: "fix_routing",
  fork_turns: "none",
})
```

`agent_type` selects the exact custom TOML. It must be paired with
`fork_turns = "none"` or a bounded positive history; the default/`"all"`
rejected role/model/reasoning overrides in the tested runtime. A returned
configured nickname is identity evidence; a task path is not.

## Hook Runtime

Agent lifecycle evidence is routed through `@fusengine/harness`. The migration
has no direct-command exception path: every configured command handler invokes
its canonical Harness route. Harness 0.1.79 still has Codex compatibility gaps
for design lifecycle, Claude-rooted state, and events Codex does not emit; see
[Hooks System](../reference/hooks.md#harness-0179-runtime-limits).
