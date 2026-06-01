#!/usr/bin/env bun
// @hook-entry
/**
 * validate-fusecore.native.ts — native TS port of _legacy_py/validate-fusecore.py.
 *
 * PreToolUse(apply_patch): when FuseCore/ exists, block domain code under app/
 * (must live in FuseCore/{Module}/), require module.json per module, and block
 * cross-module `use FuseCore\X\` imports (only Core allowed). The blocked-dir
 * list, regexes and deny strings are verbatim from the Python.
 */
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import { denyBlock, findProjectRootMarkers } from "../../core-guards/scripts/_shared/expert-skill-gate";
import { isFusecoreProject } from "../../_shared/scripts/modular-detection";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

const BLOCKED_IN_APP = [
  "/app/Models/", "/app/Services/", "/app/Actions/", "/app/Http/Controllers/",
  "/app/Http/Requests/", "/app/Http/Resources/", "/app/Contracts/", "/app/DTOs/",
  "/app/Repositories/", "/app/Events/", "/app/Listeners/", "/app/Jobs/",
  "/app/Notifications/", "/app/Policies/",
];
const strip = (s: string): string => s.replace(/^\/+|\/+$/g, "");

let data: Parameters<typeof editTargets>[0];
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

for (const t of editTargets(data)) {
  const fp = t.filePath;
  if (!fp.endsWith(".php") || /\/(vendor|storage|bootstrap\/cache)\//.test(fp)) continue;
  const root = findProjectRootMarkers(dirname(fp), "composer.json", "artisan", ".git");
  if (!isFusecoreProject(root)) continue;

  for (const blocked of BLOCKED_IN_APP) {
    if (fp.includes(blocked)) {
      const targetPath = blocked.replace("/app/", "/FuseCore/{Module}/App/");
      denyBlock(`BLOCKED: FuseCore project. Code in '${strip(blocked)}' FORBIDDEN. Move to '${strip(targetPath)}'.`);
    }
  }

  const mod = fp.match(/\/FuseCore\/([A-Za-z]+)\//);
  if (mod) {
    const mj = join(root, "FuseCore", mod[1], "module.json");
    if (!(existsSync(mj) && statSync(mj).isFile())) {
      denyBlock(`BLOCKED: Module '${mod[1]}' missing module.json. Create ${mj} first.`);
    }
  }

  const content = t.content;
  const cross = [...content.matchAll(/use\s+FuseCore\\(\w+)\\/g)].map((m) => m[1]);
  if (mod && mod[1] !== "Core") {
    const current = mod[1];
    for (const imported of cross) {
      if (imported !== current && imported !== "Core") {
        denyBlock(`BLOCKED: Cross-module import. '${current}' uses '${imported}'. Only FuseCore\\Core\\ allowed.`);
      }
    }
  }
  if (mod && mod[1] === "Core") {
    for (const imported of cross) {
      if (imported !== "Core") {
        denyBlock(`BLOCKED: FuseCore\\Core\\ must NOT import from FuseCore\\${imported}\\. Core must be independent.`);
      }
    }
  }
}
allowPass("validate-fusecore", "FuseCore structure ok");
