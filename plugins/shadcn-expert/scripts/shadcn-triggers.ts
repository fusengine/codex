/**
 * shadcn-triggers.ts — TS port of shadcn_skill_triggers.py (data + detector).
 *
 * Domain-skill trigger map for shadcn/ui, compiled case-insensitive to match
 * the Python re.IGNORECASE. detectRequiredSkills + framework-bound
 * specificSkillConsulted come from the shared makeSkillDetector factory (DRY).
 */
import { makeSkillDetector } from "../../core-guards/scripts/_shared/skill-trigger-detector";

/** Compile a list of raw patterns case-insensitive. */
const ci = (patterns: string[]): RegExp[] => patterns.map((p) => new RegExp(p, "i"));

/** Ordered shadcn domain-skill triggers (pattern → skill). */
export const SHADCN_TRIGGERS: Record<string, RegExp[]> = {
  "shadcn-detection": ci([
    "components\\.json", "@radix-ui/", "@base-ui/",
    "data-\\[state=", "data-\\[disabled\\]",
  ]),
  "shadcn-components": ci([
    "from\\s+['\"].*components/ui/",
    "<(Button|Input|Select|Dialog|Card|Table|Tabs|Badge)\\b",
    "(Popover|Tooltip|Sheet|Drawer|Command|Accordion)\\b",
  ]),
  "shadcn-theming": ci([
    "--(primary|secondary|muted|accent|destructive|foreground):",
    "(cssVariables|themeConfig|globals\\.css)\\b",
    ":root\\s*\\{|\\.dark\\s*\\{",
  ]),
  "shadcn-registries": ci([
    "mcp__shadcn__(search|view|get_add_command|list_items)",
    "bunx.*shadcn@latest\\s+add\\b",
    "(registries|@shadcn|@acme)\\b",
  ]),
  "shadcn-migration": ci([
    "(@radix-ui.*@base-ui|@base-ui.*@radix-ui)",
    "(migrat|convert|switch).*(radix|base.?ui)",
  ]),
};

const detector = makeSkillDetector("shadcn", SHADCN_TRIGGERS);
export const detectRequiredSkills = detector.detectRequiredSkills;
export const specificSkillConsulted = detector.specificSkillConsulted;
