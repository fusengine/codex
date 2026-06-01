/**
 * track-time.ts — shared UTC timestamp helper for tracking post-hooks.
 *
 * The Python hooks format timestamps as ``%Y-%m-%dT%H:%M:%SZ`` (second
 * precision, no milliseconds). ``Date.toISOString`` emits milliseconds, so
 * strip the ``.mmm`` fraction to keep recorded entries byte-identical.
 */

/**
 * Return the current UTC time as ``YYYY-MM-DDTHH:MM:SSZ``.
 *
 * @returns ISO-8601 UTC timestamp truncated to whole seconds.
 */
export function utcStamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}
