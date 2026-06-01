/**
 * build-tree.native.ts — native TS port of _legacy_py/lib/build_tree.py.
 * Renders structured plugin items (agent/skill/command/hooks) into a Unicode
 * indented tree, optionally with markdown links. Dependency-free; inlined into
 * generate_map. Connectors, ordering and link shapes match the Python.
 */

/** One scanned plugin row: [type, name, description]. */
export type Row = [string, string, string];

/** Format items with tree connectors + optional links (mirrors _print_items). */
function printItems(prefix: string, items: [string, string][], folder = "", asDirs = false): string[] {
  const lines: string[] = [];
  items.forEach(([name, desc], i) => {
    const connector = i === items.length - 1 ? "└──" : "├──";
    const safe = name.replace(/^\/+/, "");
    let label: string;
    if (folder && asDirs) label = `[${name}](./${folder}/${safe}/index.md)`;
    else if (folder) label = `[${name}](./${folder}/${safe}.md)`;
    else label = name;
    const short = desc && desc !== "(no description)" ? ` — ${desc.slice(0, 80)}` : "";
    lines.push(`${prefix}${connector} ${label}${short}`);
  });
  return lines;
}

/**
 * Build an indented tree from rows; when linked, items become markdown links
 * (mirrors build_tree). Section order: agent, skill, command, then hooks.
 * @param items - Scanned rows.
 * @param linked - Emit markdown links when true.
 */
export function buildTree(items: Row[], linked = false): string {
  const groups: Record<string, [string, string][]> = {};
  let hooksLine = "";
  for (const [typ, name, desc] of items) {
    if (typ === "hooks") hooksLine = name;
    else (groups[typ] ??= []).push([name, desc]);
  }

  const sectionOrder = ["agent", "skill", "command"];
  const sections = sectionOrder.filter((s) => s in groups);
  if (hooksLine) sections.push("hooks");

  const lines: string[] = [];
  const total = sections.length;
  sections.forEach((section, idx) => {
    const isLast = idx === total - 1;
    if (section === "hooks") {
      lines.push(`└── hooks: ${hooksLine}`);
      return;
    }
    const folder = `${section}s`;
    const prefix = isLast ? "└──" : "├──";
    const subPrefix = isLast ? "    " : "│   ";
    lines.push(`${prefix} ${folder}/`);
    const linkFolder = linked ? folder : "";
    const isDirSection = section === "skill";
    lines.push(...printItems(subPrefix, groups[section]!, linkFolder, linked && isDirSection));
  });
  return lines.join("\n");
}
