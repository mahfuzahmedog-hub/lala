import { segmentSentences, type Segment } from "./text";
import type { TranscriptWord } from "../types";

const HOOK_CUES = [
  "here's why",
  "the reason",
  "what if",
  "did you know",
  "the truth",
  "nobody",
  "the biggest",
  "the secret",
  "this is why",
  "you won't believe",
];

function hookScore(sentence: string): number {
  const lower = sentence.toLowerCase();
  let score = 0;
  for (const c of HOOK_CUES) if (lower.includes(c)) score += 2;
  if (/\?$/.test(sentence.trim())) score += 1.5;
  if (/\b\d+\b/.test(sentence)) score += 1;
  // Prefer punchy openers.
  const words = sentence.split(/\s+/).length;
  if (words <= 12) score += 1;
  return score;
}

/**
 * Produce a hook line for a clip. Critically, the hook is **extractive** — it is
 * a real phrase spoken in the clip, never invented — which honours build rule #7
 * ("never fabricate source facts when generating hooks"). We pick the most
 * hook-like sentence and trim it to a punchy length.
 */
export function generateHook(words: TranscriptWord[], maxWords = 10): string {
  const segments: Segment[] = segmentSentences(words);
  if (segments.length === 0) return "";
  let best = segments[0];
  let bestScore = -Infinity;
  // Bias toward the opening sentences (first third of the clip).
  const horizon = Math.max(1, Math.ceil(segments.length / 3));
  for (let i = 0; i < segments.length; i++) {
    const positionBonus = i < horizon ? 1 : 0;
    const s = hookScore(segments[i].text) + positionBonus;
    if (s > bestScore) {
      bestScore = s;
      best = segments[i];
    }
  }
  const trimmed = best.text.split(/\s+/).slice(0, maxWords).join(" ");
  return trimmed.replace(/[,;:]$/, "").trim();
}
