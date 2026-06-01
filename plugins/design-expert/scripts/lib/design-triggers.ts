/**
 * design-triggers.ts — TS port of design_skill_triggers.py (data + detector).
 *
 * Domain-skill trigger map for design-expert, compiled case-insensitive to match
 * the Python re.IGNORECASE. detectRequiredSkills + framework-bound
 * specificSkillConsulted come from the shared makeSkillDetector factory (DRY).
 */
import { makeSkillDetector } from "../../../core-guards/scripts/_shared/skill-trigger-detector";

/** Compile a list of raw patterns case-insensitive. */
const ci = (patterns: string[]): RegExp[] => patterns.map((p) => new RegExp(p, "i"));

/** Ordered design domain-skill triggers (pattern → skill). */
export const DESIGN_TRIGGERS: Record<string, RegExp[]> = {
  "3-generating-components": ci([
    "className\\s*=\\s*[\"\\{]",
    "<(div|section|main|header|footer|nav|aside)\\s",
    "(flex|grid|gap-|p-|m-|bg-|text-|rounded|shadow|border)",
    "(Button|Card|Dialog|Sheet|Input|Select|Table)\\b",
    "(cva|class-variance-authority|variants)\\b",
    "(VariantProps|variant.*:\\s*\\{)\\b",
    "(children|slots|asChild|Slot|render.?prop)\\b",
    "(forwardRef|React\\.cloneElement|compound)\\b",
  ]),
  "1-designing-systems": ci([
    "--(\\w+-)+color:|:root\\s*\\{|@theme\\b",
    "(design.?system|token|palette|typography.?scale)\\b",
    "--(\\w+)-(foreground|background|primary|muted|accent):",
    "(cssVariables|themeConfig|colorScheme)\\b",
    "(dark:|prefers-color-scheme|next-themes|useTheme)\\b",
    "(ThemeProvider|data-theme|color-scheme)\\b",
    "(sm:|md:|lg:|xl:|2xl:)\\b",
    "(@container|container-type|@media)\\b",
    "(clamp\\(|fluid|min-width:)\\b",
  ]),
  "4-adding-animations": ci([
    "(motion\\.|framer-motion|animate|variants)\\b",
    "(whileHover|whileTap|AnimatePresence|transition)\\b",
    "@keyframes\\b|animation:\\s",
    "(backdrop-blur|bg-.*/([\\d]+)|glass)\\b",
    "backdrop-filter:\\s*blur",
    "(hover:|focus:|active:|disabled:|focus-visible:)\\b",
    "(data-\\[state=|data-\\[disabled\\])\\b",
    "(bg-gradient|from-|via-|to-)\\b",
    "(radial-gradient|conic-gradient|bg-\\[url)\\b",
    "(blur-.*xl|opacity-|mix-blend)\\b",
  ]),
  "5-design-audit": ci([
    "(aria-|role=|sr-only|tabIndex|alt=)\\b",
    "(WCAG|a11y|contrast|screen.?reader)\\b",
  ]),
};

const detector = makeSkillDetector("design", DESIGN_TRIGGERS);
export const detectRequiredSkills = detector.detectRequiredSkills;
export const specificSkillConsulted = detector.specificSkillConsulted;
