---
name: shadcn-components
description: "Component patterns for shadcn/ui with both Radix UI and Base UI primitives. Covers API differences, mapping between primitives, and correct usage patterns. Use when: building or editing shadcn/ui components, mapping Radix vs Base UI APIs, or choosing composition patterns (asChild vs render)."
---

# shadcn Components

## Agent Workflow (MANDATORY)

Before component work, spawn sub-agents in parallel via `spawn_agent`:

1. **explore-codebase** - Find existing components
2. **research-expert** - Verify component APIs via Context7
3. **mcp__shadcn__search_items_in_registries** - Search available components

After: Run **sniper** for validation.

---

## Overview

| Feature | Description |
|---------|-------------|
| **Radix primitives** | Default shadcn/ui since 2021 |
| **Base UI primitives** | New option since late 2025 |
| **Component mapping** | 1:1 mapping between both |
| **API differences** | asChild vs render, naming |

---

## Critical Rules

1. **ALWAYS detect primitive** before component work (shadcn-detection)
2. **ALWAYS consult MCP** before adding any component
3. **NEVER mix** Radix and Base UI APIs in same component
4. **MATCH composition** pattern to detected primitive
5. **USE registry source** as truth, not manual code

---

## Architecture

```
components/ui/
├── dialog.tsx          # Adapted to detected primitive
├── select.tsx
├── accordion.tsx
└── ...
```

-> See [dialog-example.md](references/templates/dialog-example.md) for complete component

---

## MCP Usage (MANDATORY)

ALWAYS consult shadcn MCP before adding components:

```
mcp__shadcn__search_items_in_registries -> find component
mcp__shadcn__view_items_in_registries   -> view source
mcp__shadcn__get_add_command_for_items  -> get install command
```

---

## Component Mapping Table

| Component | Radix Part | Base UI Part |
|-----------|-----------|--------------|
| Dialog | `DialogContent` | `Dialog.Popup` |
| Dialog | `DialogOverlay` | `Dialog.Backdrop` |
| Select | `SelectContent` | `Select.Positioner` + `Select.Popup` |
| Tooltip | `TooltipContent` | `Tooltip.Positioner` + `Tooltip.Popup` |
| Accordion | `AccordionContent` | `Accordion.Panel` |
| Popover | `PopoverContent` | `Popover.Positioner` + `Popover.Popup` |
| Menu | `DropdownMenuContent` | `Menu.Positioner` + `Menu.Popup` |

---

## Composition Patterns

### Radix: `asChild`

```tsx
<Dialog.Trigger asChild>
  <Button variant="outline">Open</Button>
</Dialog.Trigger>
```

### Base UI: `render`

```tsx
<Dialog.Trigger render={<Button variant="outline" />}>
  Open
</Dialog.Trigger>
```

---

## Reference Guide

### Concepts

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Radix APIs** | [radix-components.md](references/radix-components.md) | Building with Radix primitives |
| **Base UI APIs** | [baseui-components.md](references/baseui-components.md) | Building with Base UI primitives |

### Templates

| Template | When to Use |
|----------|-------------|
| [dialog-example.md](references/templates/dialog-example.md) | Creating Dialog components |

---

## Best Practices

### DO
- Detect primitive FIRST (use shadcn-detection)
- Consult MCP for component source before editing
- Follow existing naming conventions in project
- Use correct composition pattern for detected primitive

### DON'T
- Mix asChild and render in same component
- Assume Radix without detection
- Manually write component internals (use MCP)
- Skip registry check before adding new components
