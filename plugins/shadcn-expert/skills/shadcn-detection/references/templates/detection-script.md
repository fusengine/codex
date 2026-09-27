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
The equivalent checks, run from the project root:

```bash
# 0. Authoritative when components.json exists (CLI 4.x): base = base | radix | aria
{runner} shadcn@latest info --json | jq -r '.config.base, .config.style'

# 1. package.json deps (40%)
grep -oE '"(radix-ui|@radix-ui/react-[a-z-]+|@base-ui/react|react-aria-components)"' package.json

# 2. components.json style (20%): base-* | radix-* / new-york | aria-*
grep '"style"' components.json

# 3. Import patterns (25%)
grep -rlE 'from "(radix-ui|@radix-ui/react-[a-z-]+)"' src components app 2>/dev/null | wc -l
grep -rl 'from "@base-ui/react' src components app 2>/dev/null | wc -l   # a radix-* combobox.tsx alone does not count
grep -rl 'from "react-aria-components"' src components app 2>/dev/null | wc -l

# 4. Data attributes (15%) - weak signal: radix-*/base-* registry styles both emit `data-open:`
grep -rl 'data-\[state=' src components app 2>/dev/null | wc -l
grep -rlE 'data-\[(open|closed)\]|data-(starting|ending)-style' src components app 2>/dev/null | wc -l
grep -rlE 'data-(entering|exiting):|data-\[placement=' src components app 2>/dev/null | wc -l

# 5. Package manager (lockfile)
ls bun.lock bun.lockb pnpm-lock.yaml yarn.lock package-lock.json 2>/dev/null

# Example output (produced by the agent, not a script)
# {"primitive":"radix","confidence":85,"pm":"bun","runner":"bunx","signals":["pkg:radix-ui","style:new-york","import:radix","attr:data-state","pm:bun"]}
```

### Interpreting Results

```typescript
// Shape of the recorded verdict
interface DetectionResult {
  primitive: "radix" | "base-ui" | "react-aria" | "mixed" | "none"
  confidence: number  // 0-100
  pm: "bun" | "npm" | "pnpm" | "yarn"
  runner: "bunx" | "npx" | "pnpm dlx" | "yarn dlx"
  signals: string[]
}

// Usage in agent workflow
const result: DetectionResult = JSON.parse(verdict) // verdict = JSON recorded above

if (result.primitive === "radix") {
  // Use Radix patterns: asChild, data-state, namespace imports
} else if (result.primitive === "base-ui") {
  // Use Base UI patterns: render prop, data-[open], subpath imports
} else if (result.primitive === "react-aria") {
  // Use React Aria patterns: trigger wrapper, slot, onPress, data-entering
} else if (result.primitive === "mixed") {
  // Flag for migration: two or more bases detected
} else {
  // Fresh setup: `init` defaults to Base UI (-b radix | -b aria to choose)
}

// Use detected runner for CLI commands
const addCommand = `${result.runner} shadcn@latest add button`
```

### Agent Workflow Integration

1. Run the 5-signal scan (package.json, components.json, imports, data
   attributes, lockfile) as described in detection-algorithm.md, starting with
   `shadcn info --json` when `components.json` exists.
2. Build the `DetectionResult` JSON shown above from the scan.
3. Use the detected `runner` for CLI commands, e.g.:

```bash
# Step 3: Use runner for CLI (RUNNER derived from the scan, e.g. "bunx")
$RUNNER shadcn@latest add dialog
```
