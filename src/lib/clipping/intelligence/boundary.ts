import type { Scene, TranscriptWord } from "../types";

export interface BoundaryInput {
  start: number;
  end: number;
  words: TranscriptWord[];
  silences: { start: number; end: number }[];
  scenes: Scene[];
  minClipSec: number;
  maxClipSec: number;
}

/**
 * Refine a candidate's raw [start, end] into clean cut points:
 *  1. Align to word boundaries so we never cut mid-word.
 *  2. Trim leading/trailing silence.
 *  3. Snap to a nearby scene cut when one is close, so the visual cut lines up.
 *  4. Clamp the duration back into the allowed band.
 */
export function optimizeBoundaries(input: BoundaryInput): { start: number; end: number } {
  const inRange = input.words.filter((w) => w.end > input.start && w.start < input.end);
  let start = inRange.length ? inRange[0].start : input.start;
  let end = inRange.length ? inRange[inRange.length - 1].end : input.end;

  // Trim a silence that overlaps the very start / very end.
  for (const s of input.silences) {
    if (s.start <= start + 0.05 && s.end > start && s.end < end) start = s.end;
    if (s.end >= end - 0.05 && s.start < end && s.start > start) end = s.start;
  }

  // Snap to a scene boundary if one is within 0.5s (keeps visual cuts clean).
  const snap = (t: number): number => {
    let best = t;
    let bestDist = 0.5;
    for (const sc of input.scenes) {
      for (const edge of [sc.start, sc.end]) {
        const d = Math.abs(edge - t);
        if (d < bestDist) {
          bestDist = d;
          best = edge;
        }
      }
    }
    return best;
  };
  start = Math.max(0, snap(start));
  end = snap(end);

  // Clamp duration into [min, max].
  const dur = end - start;
  if (dur < input.minClipSec) end = start + input.minClipSec;
  if (end - start > input.maxClipSec) end = start + input.maxClipSec;

  return { start: Math.max(0, start), end };
}
