/**
 * tailwind-skill-triggers.native.ts — native TS port of
 * _legacy_py/tailwind_skill_triggers.py. Domain-skill detection for Tailwind:
 * maps code patterns → required skills, and binds specificSkillConsulted to the
 * "tailwind" framework. Imported (and inlined) by check-tailwind-skill.native.ts.
 */
import { makeSkillDetector } from "../../core-guards/scripts/_shared/skill-trigger-detector";

/** Pattern → skill triggers, mirroring SKILL_TRIGGERS in the Python (order preserved). */
const SKILL_TRIGGERS: Record<string, RegExp[]> = {
  "tailwindcss-v4": [/@theme\b/, /@source\b/, /@utility\b/, /@variant\b/, /@import\s+['"]tailwindcss/, /@config\b/],
  "tailwindcss-layout": [/\b(flex|grid|inline-flex|inline-grid)\b/, /(justify|items|place)-(start|end|center|between)/, /(grid-cols|grid-rows|col-span|row-span)-/, /(absolute|relative|fixed|sticky)\b/],
  "tailwindcss-typography": [/(font-sans|font-serif|font-mono|font-bold|font-semibold)\b/, /(text-xs|text-sm|text-base|text-lg|text-xl|text-2xl)\b/, /(tracking-|leading-|line-clamp-)\b/],
  "tailwindcss-backgrounds": [/(bg-gradient|bg-linear|bg-radial|bg-conic)\b/, /(from-|via-|to-)\w+/, /bg-\[url\b/],
  "tailwindcss-borders": [/(rounded-|border-|ring-|outline-|divide-)\w+/, /(border-dashed|border-dotted|border-double)\b/],
  "tailwindcss-effects": [/(shadow-|opacity-|blur-|brightness-|contrast-)\w+/, /(backdrop-blur|backdrop-brightness|backdrop-contrast)\b/, /(inset-shadow-|mask-)\w+/],
  "tailwindcss-transforms": [/(scale-|rotate-|translate-|skew-)\w+/, /(transition-|duration-|ease-|delay-)\w+/, /(animate-spin|animate-pulse|animate-bounce)\b/],
  "tailwindcss-responsive": [/(sm:|md:|lg:|xl:|2xl:)\w+/, /(@container|container-type)\b/, /(min-\[|max-\[)\d+/],
  "tailwindcss-spacing": [/\b[pm][xytblr]?-\d+\b/, /(space-x-|space-y-|gap-)\d+/],
  "tailwindcss-sizing": [/\b[wh]-(full|screen|auto|min|max|fit)\b/, /(min-w-|max-w-|min-h-|max-h-)\w+/, /(aspect-video|aspect-square)\b/],
  "tailwindcss-interactivity": [/(cursor-|select-|pointer-events-|scroll-)\w+/, /(snap-|overscroll-|touch-)\w+/],
  "tailwindcss-custom-styles": [/@apply\b/, /@utility\s+\w+/, /@variant\s+\w+/, /theme\(\s*['"]/],
};

const detector = makeSkillDetector("tailwind", SKILL_TRIGGERS);

/** Detect which Tailwind skills the code content requires (first match per skill). */
export const detectRequiredSkills = detector.detectRequiredSkills;
/** True if a specific Tailwind skill was read (binds framework="tailwind"). */
export const specificSkillConsulted = detector.specificSkillConsulted;
