#!/usr/bin/env bun
// @hook-entry
/**
 * validate-nextjs-modular.native.ts — native TS port of
 * _legacy_py/validate-nextjs-modular.py.
 *
 * PreToolUse(apply_patch): when modules/ exists, block non-convention files in
 * app/ and cross-module imports (only modules/cores allowed). Convention/static
 * regexes, the app/ + src/app/ relpath checks and the deny strings are verbatim.
 */
import { dirname, relative, basename } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import { denyBlock, findProjectRootMarkers } from "../../core-guards/scripts/_shared/expert-skill-gate";
import { isNextjsModular } from "../../_shared/scripts/modular-detection";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

const CONVENTION = /^(page|layout|loading|error|not-found|route|template|default|global-error|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest|middleware)\.(tsx|ts|js|jsx)$/;
const STATIC = /\.(css|ico|png|jpg|svg|json)$/;
const CROSS = /from\s+['"][@.].*?\/modules\/([^/]+)\//g;

let data: Parameters<typeof editTargets>[0];
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

for (const t of editTargets(data)) {
  const fp = t.filePath;
  if (!/\.(tsx|ts|jsx|js)$/.test(fp) || /\/(node_modules|dist|build|\.next)\//.test(fp)) continue;
  const root = findProjectRootMarkers(dirname(fp), "package.json", ".git");
  if (!isNextjsModular(root)) continue;

  const rel = relative(root, fp);
  if (rel.startsWith("app/") || rel.startsWith("src/app/")) {
    const bn = basename(fp);
    if (!CONVENTION.test(bn) && !STATIC.test(bn)) {
      denyBlock(`BLOCKED: Modular Next.js (modules/ exists). '${bn}' is NOT a convention file. Move to modules/[feature]/. Only page.tsx, layout.tsx, route.ts allowed in app/.`);
    }
  }

  const content = t.content;
  const mod = fp.match(/\/modules\/([^/]+)\//);
  const cross = [...content.matchAll(CROSS)].map((m) => m[1]);
  if (mod && mod[1] !== "cores") {
    const current = mod[1];
    for (const imported of cross) {
      if (imported !== current && imported !== "cores" && imported !== "core") {
        denyBlock(`BLOCKED: Cross-module import. '${current}' imports from '${imported}'. Only modules/cores/ allowed.`);
      }
    }
  }
  if (mod && mod[1] === "cores") {
    for (const imported of cross) {
      if (imported !== "cores" && imported !== "core") {
        denyBlock(`BLOCKED: modules/cores/ must NOT import from modules/${imported}/. Cores must be independent.`);
      }
    }
  }
}
allowPass("validate-nextjs-modular", "modular structure ok");
