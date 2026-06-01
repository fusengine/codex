/**
 * swift-skill-triggers.native.ts — native TS port of
 * _legacy_py/swift_skill_triggers.py. Domain-skill detection for Swift/Apple:
 * supplies the SKILL_TRIGGERS map; detection + framework-bound read-check come
 * from the shared makeSkillDetector factory. Inlined by check-swift-skill.native.ts.
 */
import { makeSkillDetector } from "../../core-guards/scripts/_shared/skill-trigger-detector";

/** Pattern → skill triggers, mirroring SKILL_TRIGGERS in the Python (order preserved). */
const SKILL_TRIGGERS: Record<string, RegExp[]> = {
  "swiftui-core": [/\bstruct\s+\w+\s*:\s*View\b/, /@State\b/, /@Binding\b/, /@Observable\b/, /@Environment\b/, /NavigationStack\b/, /\.sheet\b/, /\.toolbar\b/, /\.task\b/],
  "swift-core": [/\bactor\b/, /\basync\s+(let|func|throws)\b/, /\bawait\b/, /Task\s*\{/, /TaskGroup\b/, /Sendable\b/, /@MainActor\b/],
  "ios": [/UIKit|UIViewController|UIView\b/, /UIApplication\b/, /\.simulatorId\b/, /import\s+UIKit\b/],
  "macos": [/AppKit|NSViewController|NSWindow\b/, /NSApplication\b/, /\.menuBar\b/, /import\s+AppKit\b/],
  "watchos": [/WatchKit|WKInterface|WKExtension\b/, /HealthKit|HKWorkout\b/, /WatchConnectivity\b/],
  "visionos": [/RealityKit|RealityView|ImmersiveSpace\b/, /\.volumeBaseplateVisibility\b/, /SpatialTapGesture\b/],
  "ipados": [/UISplitViewController|UIKeyCommand\b/, /\.horizontalSizeClass\b/, /pencilInteraction\b/],
  "tvos": [/TVUIKit|focusable\b/, /\.focusSection\b/, /TVMonogram\b/],
  "build-distribution": [/TestFlight|AppStore\b/, /\.entitlements\b/, /codesign|notarize|archive\b/],
};

const detector = makeSkillDetector("swift", SKILL_TRIGGERS);

/** Detect which Swift skills the code content requires (first match per skill). */
export const detectRequiredSkills = detector.detectRequiredSkills;
/** True if a specific Swift skill was read (binds framework="swift"). */
export const specificSkillConsulted = detector.specificSkillConsulted;
