/**
 * Locates and validates the taste-first task marker used by creative pipeline hooks.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { flagAgentId } from "./design-state";

const MARKER_PARTS = [".harness", "apex", "taste-first.json"];

export interface TasteFirstMarker {
  lane: "taste-first";
  register: "brand";
  move: "generate" | "redesign";
  firstFrameLocked: boolean;
  active: true;
  ownerAgentId: string;
}

interface LocatedMarker {
  marker: TasteFirstMarker;
  path: string;
}

function isTasteFirstMarker(value: unknown): value is TasteFirstMarker {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const marker = value as Record<string, unknown>;
  return marker.lane === "taste-first"
    && marker.register === "brand"
    && (marker.move === "generate" || marker.move === "redesign")
    && typeof marker.firstFrameLocked === "boolean"
    && marker.active === true
    && typeof marker.ownerAgentId === "string"
    && marker.ownerAgentId.length > 0;
}

function locateTasteFirstMarker(startDir: string, ownerAgentId: string): LocatedMarker | null {
  let dir = resolve(startDir);
  while (true) {
    const path = join(dir, ...MARKER_PARTS);
    if (existsSync(path)) {
      try {
        const value: unknown = JSON.parse(readFileSync(path, "utf8"));
        if (isTasteFirstMarker(value) && value.ownerAgentId === ownerAgentId) {
          return { marker: value, path };
        }
      } catch { /* invalid nearest marker is a fail-closed task boundary */ }
      return null;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Find a valid taste-first marker from startDir or one of its parents. */
export function findTasteFirstMarker(
  startDir = process.cwd(),
  ownerAgentId = flagAgentId(),
): TasteFirstMarker | null {
  if (!ownerAgentId) return null;
  return locateTasteFirstMarker(startDir, ownerAgentId)?.marker ?? null;
}

/** Whether obsolete phase-order gates must yield to the taste-first workflow. */
export function tasteFirstBypassActive(
  startDir = process.cwd(),
  ownerAgentId = flagAgentId(),
): boolean {
  return findTasteFirstMarker(startDir, ownerAgentId) !== null;
}

/** Whether pre-lock design-system validation must yield to first-frame work. */
export function tasteFirstPreLock(
  startDir = process.cwd(),
  ownerAgentId = flagAgentId(),
): boolean {
  return findTasteFirstMarker(startDir, ownerAgentId)?.firstFrameLocked === false;
}

/** Deactivate the current task marker so later design tasks preserve legacy gates. */
export function deactivateTasteFirstMarker(
  startDir = process.cwd(),
  ownerAgentId = flagAgentId(),
): boolean {
  if (!ownerAgentId) return false;
  const located = locateTasteFirstMarker(startDir, ownerAgentId);
  if (!located) return false;
  writeFileSync(located.path, JSON.stringify({ ...located.marker, active: false }, null, 2));
  return true;
}
