/**
 * react-triggers.ts — TS port of react_skill_triggers.py (data + detector).
 *
 * Domain-skill trigger map for React, compiled case-insensitive to match the
 * Python re.IGNORECASE. react-shadcn reuses the shared SHADCN_PATTERNS. Logic
 * (detectRequiredSkills, framework-bound specificSkillConsulted) comes from the
 * shared makeSkillDetector factory so it stays DRY across experts.
 */
import { makeSkillDetector } from "../../core-guards/scripts/_shared/skill-trigger-detector";
import { SHADCN_PATTERNS } from "../../_shared/scripts/shadcn-patterns";

/** Compile a list of raw patterns case-insensitive. */
const ci = (patterns: string[]): RegExp[] => patterns.map((p) => new RegExp(p, "i"));

/** Ordered React domain-skill triggers (pattern → skill). */
export const REACT_TRIGGERS: Record<string, RegExp[]> = {
  "react-19": ci([
    "\\buse\\b\\s*\\(", "useOptimistic\\b", "useActionState\\b",
    "useEffectEvent\\b", "<Activity\\b", "from\\s+['\"]react['\"]",
  ]),
  "react-tanstack-router": ci([
    "(createRouter|createRoute|createRootRoute)\\b",
    "(useNavigate|useParams|useSearch|useLoaderData)\\b",
    "from\\s+['\"]@tanstack/(react-router|router)",
    "(routeTree|createFileRoute|createLazyFileRoute)\\b",
  ]),
  "react-forms": ci([
    "(useForm|useAppForm|createFormHook|formOptions)\\b",
    "(mergeForm|formApi|FieldApi|FormApi)\\b",
    "form\\.(Field|Subscribe|handleSubmit)\\b",
    "from\\s+['\"]@tanstack/(react-form|zod-form-adapter)",
  ]),
  "react-state": ci([
    "(create|createStore)\\(\\s*\\(\\s*set",
    "from\\s+['\"]zustand(/\\w+)?\"",
    "(useShallow|useStore|skipHydration)\\b",
    "(persist|devtools|immer)\\(",
  ]),
  "react-testing": ci([
    "(render|screen|fireEvent|waitFor)\\b",
    "from\\s+['\"]@testing-library/react",
    "(describe|it|expect|vi\\.|jest\\.)\\b",
    "from\\s+['\"]vitest",
  ]),
  "react-shadcn": SHADCN_PATTERNS,
  "react-i18n": ci([
    "(useTranslation|Trans)\\b",
    "from\\s+['\"]react-i18next",
    "\\bt\\(\\s*['\"]", "i18n\\.(language|changeLanguage)",
  ]),
};

const detector = makeSkillDetector("react", REACT_TRIGGERS);
export const detectRequiredSkills = detector.detectRequiredSkills;
export const specificSkillConsulted = detector.specificSkillConsulted;
