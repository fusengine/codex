## Frontend Tasks

### Web UI Workflow
1. **Gemini Design MCP** designs layout/pages using **shadcn/ui** components when available; they work together.
2. **shadcn/ui** (`shadcn-ui-expert`) handles component registry, installation, and patterns (`nextjs-shadcn` / `react-shadcn`).
3. **Do not hand-write new styled JSX/Tailwind UI from scratch** when Gemini Design, shadcn, or a design expert is available and useful.

### Gemini Design Tools

| Tool | Usage |
|------|-------|
| `create_frontend` | Complete responsive views |
| `modify_frontend` | Surgical redesign |
| `snippet_frontend` | Isolated components |

**FORBIDDEN without shadcn/Gemini/design expert when available:** new styled React components, CSS/Tailwind layouts, forms, modals, tables.
**ALLOWED without tools:** text changes, application logic, data wiring, state management, accessibility fixes, and small style fixes following existing patterns.

### Apple UI Workflow

For SwiftUI, use the Apple platform expert and design expert when exposed. Follow existing design-system and platform conventions; shadcn and web-only Gemini output are not SwiftUI requirements.
