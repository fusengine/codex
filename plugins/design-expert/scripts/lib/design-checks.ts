/**
 * design-checks.ts — TS port of design_checks.py (validation warning checks).
 *
 * Accessibility, anti-pattern, forbidden-font and hardcoded-color checks. Regex
 * sources mirror the Python (IGNORECASE only where the Python used re.I);
 * runAllChecks concatenates in the same order so the joined warning string is
 * identical.
 */

/** Accessibility warnings: icon buttons need aria-label, images need alt. */
export function checkAccessibility(content: string): string[] {
  const warnings: string[] = [];
  if (!/<(button|a|input|img)/.test(content)) return warnings;
  if (/<button[^>]*>/.test(content) && !/aria-label|aria-labelledby/.test(content)) {
    const iconCount = (content.match(/<button[^>]*>[^<]*<.*Icon/g) ?? []).length;
    if (iconCount > 0) warnings.push("Accessibility: Icon buttons need aria-label.");
  }
  if (/<img[^>]*src=/.test(content)) {
    for (const m of content.matchAll(/<img[^>]*?>/g)) {
      if (!m[0].includes("alt=")) { warnings.push("Accessibility: Images need alt attribute."); break; }
    }
  }
  return warnings;
}

/** Anti-pattern warnings: colored left borders, purple/pink gradients, emoji icons. */
export function checkDesignPatterns(content: string): string[] {
  const warnings: string[] = [];
  if (/border-l-[0-9]+ border-l-(blue|green|red|purple)/.test(content)) {
    warnings.push("Design: Avoid colored left borders - use shadow or gradient.");
  }
  if (/from-purple|to-purple|via-purple|from-pink.*to-purple/.test(content)) {
    warnings.push("Design: Avoid purple/pink gradients (AI slop) - use brand colors.");
  }
  if (/>[^\x00-\x7F]+</.test(content) && />[🎯🚀💡🔥⚡️✨🎨📊💼🏆]</u.test(content)) {
    warnings.push("Design: Avoid emojis as icons - use Lucide React.");
  }
  return warnings;
}

/** Forbidden-font warnings (Roboto/Inter/Arial/Open Sans/Lato). */
export function checkForbiddenFonts(content: string): string[] {
  const warnings: string[] = [];
  if (/font-family:\s*['"]?(Roboto|Inter|Arial|Open Sans|Lato)\b/i.test(content)) {
    warnings.push("FONT BLOCKED: Forbidden font (Roboto/Inter/Arial). Use identity fonts.");
  }
  if (/@import.*fonts\.googleapis.*family=(Roboto|Inter)\b/.test(content)) {
    warnings.push("FONT BLOCKED: Google Fonts import for forbidden font. Use Fontshare.");
  }
  return warnings;
}

/** Hardcoded-color warnings (hex in className or style). */
export function checkHardcodedColors(content: string): string[] {
  const warnings: string[] = [];
  if (/className="[^"]*#[0-9a-fA-F]{3,8}[^"]*"/.test(content)) {
    warnings.push("COLOR BLOCKED: Hard-coded hex in className. Use CSS variables.");
  }
  if (/(?:color|background(?:-color)?|fill|stroke):\s*['"]?#[0-9a-fA-F]{3,8}/.test(content)) {
    warnings.push("COLOR BLOCKED: Hard-coded hex in style. Use var(--color-*).");
  }
  return warnings;
}

/** Run all design checks; returns concatenated warnings (Python order). */
export function runAllChecks(content: string): string[] {
  return [
    ...checkAccessibility(content), ...checkDesignPatterns(content),
    ...checkForbiddenFonts(content), ...checkHardcodedColors(content),
  ];
}
