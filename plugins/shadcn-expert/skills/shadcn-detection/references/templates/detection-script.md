---
name: detection-script
description: Complete example of running primitive detection on a project
keywords: detection, script, usage, example
---

# Detection Script Usage

## Complete Detection Example

### Detecting the primitive library

Inspect `package.json`, `components.json`, component imports, data attributes,
and lockfiles directly. Use the shadcn MCP registry tools to confirm ambiguous
or mixed Radix/Base UI installations.

### Interpreting Results

```typescript
// Parse detection output
interface DetectionResult {
  primitive: "radix" | "base-ui" | "mixed" | "none"
  confidence: number  // 0-100
  pm: "bun" | "npm" | "pnpm" | "yarn"
  runner: "bunx" | "npx" | "pnpm dlx" | "yarn dlx"
  signals: string[]
}

// Usage in agent workflow
const result: DetectionResult = JSON.parse(output)

if (result.primitive === "radix") {
  // Use Radix patterns: asChild, data-state, namespace imports
} else if (result.primitive === "base-ui") {
  // Use Base UI patterns: render prop, data-[open], subpath imports
} else if (result.primitive === "mixed") {
  // Flag for migration: both primitives detected
} else {
  // Fresh setup: recommend initialization
}

// Use detected runner for CLI commands
const addCommand = `${result.runner} shadcn@latest add button`
```

### Agent workflow integration

Record the detected primitive and package manager in the implementation plan,
then obtain component commands through the shadcn MCP registry tools.
