/**
 * skill-trigger-detector.ts — factory shared by every expert plugin's
 * <fw>_skill_triggers.py port. Each plugin supplies its own SKILL_TRIGGERS map
 * and framework key; this returns the two functions the Python module exposes
 * (detectRequiredSkills + framework-bound specificSkillConsulted) so the per-
 * plugin trigger files stay data-only and avoid duplicated logic (DRY).
 */
import { specificSkillConsulted as check } from "./expert-skill-gate";

/** A framework's skill detector: pattern map → required skills + read-check. */
export interface SkillDetector {
  detectRequiredSkills: (content: string) => string[];
  specificSkillConsulted: (skillName: string, sessionId: string) => boolean;
}

/**
 * Build a skill detector for one framework from its trigger map.
 * @param framework - Framework key (e.g. "tailwind", "swift") used for read-check.
 * @param triggers - Ordered map of skill name → patterns; first match flags the skill.
 * @returns The detectRequiredSkills + specificSkillConsulted pair.
 */
export function makeSkillDetector(
  framework: string,
  triggers: Record<string, RegExp[]>,
): SkillDetector {
  return {
    detectRequiredSkills(content: string): string[] {
      const required: string[] = [];
      for (const [skillName, patterns] of Object.entries(triggers)) {
        if (patterns.some((p) => p.test(content))) required.push(skillName);
      }
      return required;
    },
    specificSkillConsulted(skillName: string, sessionId: string): boolean {
      return check(framework, skillName, sessionId);
    },
  };
}
