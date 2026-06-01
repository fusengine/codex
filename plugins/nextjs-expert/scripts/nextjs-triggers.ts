/**
 * nextjs-triggers.ts — TS port of nextjs_skill_triggers.py (data + detector).
 *
 * Domain-skill trigger map for Next.js, compiled case-insensitive to match the
 * Python re.IGNORECASE. nextjs-shadcn reuses the shared SHADCN_PATTERNS. The
 * detect/consulted logic comes from the shared makeSkillDetector factory so it
 * stays DRY across experts (framework bound to "nextjs").
 */
import { makeSkillDetector } from "../../core-guards/scripts/_shared/skill-trigger-detector";
import { SHADCN_PATTERNS } from "../../_shared/scripts/shadcn-patterns";

/** Compile raw patterns case-insensitive (re.IGNORECASE parity). */
const ci = (patterns: string[]): RegExp[] => patterns.map((p) => new RegExp(p, "i"));

/** Ordered Next.js domain-skill triggers (pattern → skill). */
export const NEXTJS_TRIGGERS: Record<string, RegExp[]> = {
  "better-auth": ci([
    "(authClient|betterAuth|createAuthClient)\\b",
    "(signIn|signUp|signOut|useSession|getSession)\\b",
    "auth\\.(api|handler)\\b",
    "(prismaAdapter|drizzleAdapter|mongodbAdapter)\\b",
    "(twoFactor|passkey|magicLink|emailOtp|organization)\\b",
    "(apiKey|bearer|jwt|sso|scim|captcha|anonymous)\\b",
    "from\\s+['\"].*better-auth",
  ]),
  "nextjs-tanstack-form": ci([
    "(useForm|useAppForm|createFormHook|formOptions)\\b",
    "(mergeForm|formApi|FieldApi|FormApi)\\b",
    "form\\.(Field|Subscribe|handleSubmit)\\b",
    "(zodValidator|onServerValidate)\\b",
    "from\\s+['\"]@tanstack/(react-form|zod-form-adapter)",
  ]),
  "prisma-7": ci([
    "(PrismaClient|prismaAdapter)\\b",
    "prisma\\.(\\w+\\.\\w+|\\$\\w+)",
    "(globalForPrisma|\\$transaction|\\$queryRaw|\\$executeRaw)\\b",
    "from\\s+['\"](@prisma|\\..*generated.*prisma)",
  ]),
  "nextjs-shadcn": SHADCN_PATTERNS,
  "nextjs-zustand": ci([
    "(create|createStore)\\(\\s*\\(\\s*set",
    "from\\s+['\"]zustand(/\\w+)?\"",
    "(useShallow|useStore|skipHydration)\\b",
    "\\.(getState|setState|subscribe)\\(\\)",
    "(persist|devtools|immer)\\(",
  ]),
  "nextjs-i18n": ci([
    "(useTranslations|useLocale|useMessages|useFormatter)\\b",
    "(getTranslations|getLocale|getMessages|getFormatter)\\b",
    "(NextIntlClientProvider|defineRouting)\\b",
    "from\\s+['\"]next-intl(/\\w+)?\"",
    "\\bt\\(\\s*['\"]",
  ]),
};

const detector = makeSkillDetector("nextjs", NEXTJS_TRIGGERS);
export const detectRequiredSkills = detector.detectRequiredSkills;
export const specificSkillConsulted = detector.specificSkillConsulted;
