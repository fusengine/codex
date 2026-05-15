# .cartographer (v1.2.15)

├── agents/
│   ├── [brainstorming](./agents/brainstorming.md) — Creative design agent for APEX workflow. Use when:
│   ├── [explore-codebase](./agents/explore-codebase.md) — Codebase discovery specialist. Use when: unknown p
│   ├── [research-expert](./agents/research-expert.md) — Technical research expert. Use when: library docs 
│   ├── [seo-expert](./agents/seo-expert.md) — SEO/SEA/GEO 2026 expert. Use when: optimizing page
│   ├── [sniper-faster](./agents/sniper-faster.md) — Micro-fix applicator for ALREADY IDENTIFIED errors
│   ├── [sniper](./agents/sniper.md) — Elite code error detection and correction speciali
│   └── [websearch](./agents/websearch.md) — Quick web research via Exa only. Use when: current
├── skills/
│   ├── [agent-creator](./skills/agent-creator/index.md) — Use when creating expert agents. Generates agent.md with frontmatter, hooks, req
│   ├── [apex](./skills/apex/index.md) — **Current Task:** $ARGUMENTS
│   ├── [brainstorming](./skills/brainstorming/index.md) — Use when user requests creative work - creating features, building components, a
│   ├── [code-quality](./skills/code-quality/index.md) — Code quality validation with linters, SOLID principles, DRY detection, error det
│   ├── [elicitation](./skills/elicitation/index.md) — Auto-review skill for expert agents. After coding, expert applies elicitation te
│   ├── [exploration](./skills/exploration/index.md) — Codebase exploration techniques for rapid discovery, architecture analysis, patt
│   ├── [modularize](./skills/modularize/index.md) — Use when converting existing code to modular architecture. Detects Laravel (Fuse
│   ├── [pr-summary](./skills/pr-summary/index.md) — Summarize current pull request with diff, comments, and changed files. Use when 
│   ├── [react-effects-audit](./skills/react-effects-audit/index.md) — Audit React components for unnecessary useEffect patterns. Detects 9 anti-patter
│   ├── [research](./skills/research/index.md) — Technical research methodology using Context7, Exa, and Sequential Thinking for 
│   ├── [seo](./skills/seo/index.md) — SEO/SEA/GEO 2026 complete methodology for organic, paid, and AI search optimizat
│   ├── [skill-creator](./skills/skill-creator/index.md) — Use when creating new skills, restructuring existing skills, or improving skill 
│   ├── [sniper-check](./skills/sniper-check/index.md) — Use when validating code quality after modifications. Runs sniper agent in isola
│   ├── [tdd](./skills/tdd/index.md) — Use when writing production code that needs tests - new features, bug fixes, ref
│   └── [verification](./skills/verification/index.md) — Use when marking a task as complete, finishing a feature, or claiming a bug is f
├── commands/
│   ├── [/apex-quick](./commands/apex-quick.md) — Quick Flow for simple fixes - Single expert handle
│   ├── [/apex](./commands/apex.md) — APEX Methodology - The systematic Analyze-Plan-Exe
│   ├── [/cleanup-context](./commands/cleanup-context.md) — Memory optimization - removes duplicates, consolid
│   ├── [/commit](./commands/commit.md) — Smart conventional commits with auto-detection. An
│   ├── [/create-pull-request](./commands/create-pull-request.md) — Auto-generate Pull Request with comprehensive desc
│   ├── [/deep-code-analysis](./commands/deep-code-analysis.md) — Comprehensive codebase investigation using researc
│   ├── [/epct](./commands/epct.md) — Systematic Explore-Plan-Code-Test methodology for 
│   ├── [/explain-architecture](./commands/explain-architecture.md) — Analyze and explain software architecture with ASC
│   ├── [/fix-pr-comments](./commands/fix-pr-comments.md) — Systematically resolve Pull Request review comment
│   ├── [/prisma-optimize](./commands/prisma-optimize.md) — Optimize Prisma queries with automated analysis, N
│   ├── [/run-tasks](./commands/run-tasks.md) — Execute GitHub issues using full EPCT workflow (Ex
│   └── [/watch-ci](./commands/watch-ci.md) — Monitor CI/CD pipeline and automatically fix failu
└── hooks: PostToolUse, PreToolUse, SessionEnd, SubagentStart, SubagentStop, UserPromptSubmit
