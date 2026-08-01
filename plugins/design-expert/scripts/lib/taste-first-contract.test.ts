import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PLUGIN = join(import.meta.dir, "..", "..");
const SKILL = readFileSync(join(PLUGIN, "skills", "taste-first", "SKILL.md"), "utf8");
const AGENT = readFileSync(join(PLUGIN, "agents", "design-expert.toml"), "utf8");

test("taste-first keeps two checkpoints and the owner as ground truth", () => {
  const checkpoints = SKILL.match(/^## Promotion Checkpoint /gm) ?? [];
  expect(checkpoints).toHaveLength(2);
  expect(SKILL).toContain("owner rejection immediately invalidates");
  expect(SKILL).toContain("record it as `BLOCK` and failure");
  expect(AGENT).toContain("owner rejection immediately supersedes every prior critic `PASS`");
  expect(AGENT).toContain("- `owner_verdicts`");
});

test("the first-frame gate measures visual cost, composure, and inevitability", () => {
  const requiredClauses = [
    "Dominant device: [device]; it earns its area and complexity by [specific gain].",
    "visual-cost test",
    "improving hierarchy, brand meaning, and emotional authority",
    "Mentally remove or",
    "more premium, legible, or distinctive",
    "accidentally clipped, broken, or dependent on layout",
    "Mobile must not use clipping as a substitute for composition",
    "boldness feels inevitable to the thesis rather than detachable novelty",
  ];
  for (const clause of requiredClauses) expect(SKILL).toContain(clause);
});

test("retests expose only the latest owner verdict to the challenger", () => {
  expect(SKILL).toContain("owner's latest");
  expect(SKILL).toContain("stripped of rationale or replacement direction");
  expect(SKILL).toContain("without rationale or replacement direction");
});
