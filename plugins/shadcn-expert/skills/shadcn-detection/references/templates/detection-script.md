---
name: detection-script
description: Complete example of running primitive detection on a project
keywords: detection, script, usage, example
---

# Detection Script Usage

## Complete Detection Example

### Running Detection

There is no standalone detection script — the shadcn-expert agent applies the
5-signal algorithm from [detection-algorithm.md](../detection-algorithm.md)
directly (via `Grep`/`Read` on `package.json`, `components.json`, source
imports, and the lockfile) and produces the JSON verdict below itself.

```bash
# Example output (produced by the agent, not a script)
# {"primitive":"radix","confidence":85,"pm":"bun","runner":"bunx","signals":["pkg:radix-ui","style:new-york","import:radix","attr:data-state","pm:bun"]}
```

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

### Agent Workflow Integration

1. Run the 5-signal scan (package.json, components.json, imports, data
   attributes, lockfile) as described in detection-algorithm.md.
2. Build the `DetectionResult` JSON shown above from the scan.
3. Use the detected `runner` for CLI commands, e.g.:

```bash
# Step 3: Use runner for CLI (RUNNER derived from the scan, e.g. "bunx")
$RUNNER shadcn@latest add dialog
```
