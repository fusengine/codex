# .cartographer (v2.1.18)

├── agents/
│   └── [design-expert](./agents/design-expert.md) — UI Designer. Generates HTML/CSS only via Gemini De
├── skills/
│   ├── [0-identity-system](./skills/0-identity-system/index.md) — Phase 0: Read sector template (creative/fintech/ecommerce/devtool), generate OKL
│   ├── [1-designing-systems](./skills/1-designing-systems/index.md) — Phase 1: Browse 4 catalog sites via Playwright, write CSS-precise observations (
│   ├── [2-ux-copy](./skills/2-ux-copy/index.md) — Phase 2: Write microcopy guide: CTA labels, error messages, empty states, form p
│   ├── [3-generating-components](./skills/3-generating-components/index.md) — Phase 3: Map design-system.md to 7 Gemini XML blocks (aesthetics, style_referenc
│   ├── [4-adding-animations](./skills/4-adding-animations/index.md) — Phase 4: Add Framer Motion scroll reveals (IntersectionObserver), hover scale/op
│   ├── [5-design-audit](./skills/5-design-audit/index.md) — Phase 5: Verify contrast >= 4.5:1 text / 3:1 UI in both light+dark, check no Int
│   └── [6-handoff-review](./skills/6-handoff-review/index.md) — Phase 6: Serve via python3 -m http.server 8899, screenshot light mode (fullPage)
├── commands/
│   ├── [/design-audit](./commands/design-audit.md) — Audit existing HTML/CSS design quality. Checks WCA
│   ├── [/design-component](./commands/design-component.md) — Generate a single component. Skips browsing. Uses 
│   ├── [/design-page](./commands/design-page.md) — New page in existing project. Skips identity (desi
│   └── [/design](./commands/design.md) — Full design pipeline: Identity → Research → System
└── hooks: PostToolUse, PreToolUse, SubagentStart, SubagentStop
