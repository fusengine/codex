/**
 * shadcn-patterns.ts — bundle-safe TS port of _shared/scripts/shadcn_patterns.py.
 *
 * HTML-to-shadcn detection patterns + isShadcnProject. Patterns are compiled
 * case-insensitive to match the Python re.IGNORECASE used by the react-shadcn
 * trigger. Shared by react-expert (react-shadcn trigger + project filter) and
 * any other expert needing shadcn detection (inlined at bundle time).
 */
import { statSync } from "node:fs";
import { join } from "node:path";

const RAW: string[] = [
  // Forms
  "<(button|input|select|textarea|label|option|optgroup)\\b",
  "type=\"(checkbox|radio|range|file)\"",
  "<input[^>]*maxLength=\"[1-2]\"",
  // Overlay
  "<dialog\\b",
  "role=\"(dialog|alertdialog)\"",
  "(aria-haspopup|aria-expanded|aria-pressed)=\"",
  "(onContextMenu|onMouseEnter.*onMouseLeave)\\b",
  "\\b(confirm|window\\.confirm)\\(",
  "title=\"[^\"]{2,}\"",
  // Data
  "<(table|thead|tbody|tfoot|th|td|tr|caption|colgroup)\\b",
  "<(article|section)\\b[^>]*className",
  "rounded-full[^>]*className|className[^>]*rounded-full",
  "<img\\b[^>]*rounded",
  "(new Date|\\.toLocaleDateString|date-fns|dayjs)\\b",
  "(recharts|chart\\.js|<svg[^>]*viewBox)",
  "(scroll-snap|embla-carousel|useEmbla)\\b",
  "(page=|currentPage|totalPages|pageSize)\\b",
  // Navigation
  "<(nav|aside)\\b",
  "<(menu|menuitem)\\b",
  "role=\"(menubar|menu|menuitem|tablist|tab|tabpanel)\"",
  "aria-label=\"(breadcrumb|navigation|sidebar)\"",
  "aria-current=\"(page|step)\"",
  // Layout
  "<(hr|details|summary)\\b",
  "role=\"separator\"",
  "overflow-(auto|scroll|y-auto|x-auto)",
  "(aspect-ratio|aspect-video|aspect-square)\\b",
  "(resize|cursor-(col|row)-resize)\\b",
  // Feedback
  "role=\"(alert|status|progressbar)\"",
  "aria-live=\"(polite|assertive)\"",
  "<progress\\b",
  "(animate-pulse|animate-spin)\\b",
  "(sonner|react-hot-toast|\\.toast\\()\\b",
];

/** All shadcn detection patterns, compiled case-insensitive (re.IGNORECASE). */
export const SHADCN_PATTERNS: RegExp[] = RAW.map((p) => new RegExp(p, "i"));

/** True when path is a regular file. */
function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** True when a directory exists at path. */
function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** True if shadcn/ui is installed (components.json or a ui/ dir). */
export function isShadcnProject(projectRoot: string): boolean {
  if (isFile(join(projectRoot, "components.json"))) return true;
  for (const ui of ["src/components/ui", "components/ui", "src/modules/cores/shadcn/components/ui"]) {
    if (isDir(join(projectRoot, ui))) return true;
  }
  return false;
}
