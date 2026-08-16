import type { CandidateSignals } from "../types";

/** Count how many needles appear in the haystack (word-boundary-ish). */
function countMatches(text: string, needles: string[]): number {
  const lower = ` ${text.toLowerCase()} `;
  let hits = 0;
  for (const n of needles) {
    let idx = lower.indexOf(n);
    while (idx !== -1) {
      hits++;
      idx = lower.indexOf(n, idx + 1);
    }
  }
  return hits;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
/** Saturating transform: more hits help, with diminishing returns. */
const sat = (hits: number, k = 1.5) => clamp01(hits / (hits + k));

const HOOK_CUES = [
  "here's why",
  "the reason",
  "what if",
  "did you know",
  "the truth",
  "nobody",
  "everyone",
  "the biggest",
  "the secret",
  "let me tell you",
  "this is why",
];
const CURIOSITY_CUES = ["why", "how", "what", "secret", "hidden", "nobody knows", "wait", "imagine"];
const EMOTION_CUES = [
  "love",
  "hate",
  "amazing",
  "incredible",
  "insane",
  "terrible",
  "worst",
  "best",
  "shocked",
  "unbelievable",
  "scared",
  "angry",
  "cried",
];
const SETUP_CUES = ["so ", "when i", "back when", "at first", "it started", "let's say", "imagine"];
const TENSION_CUES = ["but ", "however", "problem", "struggle", "failed", "worst", "against", "until"];
const PAYOFF_CUES = [
  "finally",
  "turns out",
  "the result",
  "that's why",
  "the lesson",
  "in the end",
  "and then",
  "so that",
];
const DEPENDENT_OPENERS = ["that ", "this ", "it ", "he ", "she ", "they ", "and ", "but ", "so "];

export interface SignalContext {
  text: string;
  /** First sentence (used for hook/context-independence scoring). */
  opener: string;
  durationSec: number;
  audioIntensity: number; // 0..1
  visualMotion: number; // 0..1
  /** Type-token ratio of the clip text, a proxy for lexical richness. */
  lexicalRichness: number; // 0..1
}

/**
 * Score the twelve candidate signals from the spec. Each is a bounded 0..1
 * heuristic combining lexical cues with the measured audio/visual context.
 */
export function scoreSignals(ctx: SignalContext): CandidateSignals {
  const { text, opener } = ctx;
  const words = text.split(/\s+/).filter(Boolean).length;

  const hookStrength = clamp01(
    0.5 * sat(countMatches(opener, HOOK_CUES), 0.8) +
      0.25 * (/[?]/.test(opener) ? 1 : 0) +
      0.25 * (/\b\d+\b/.test(opener) ? 1 : 0),
  );
  const curiosity = sat(countMatches(text, CURIOSITY_CUES), 2);
  const emotionalIntensity = clamp01(
    0.7 * sat(countMatches(text, EMOTION_CUES), 2) +
      0.3 * sat((text.match(/[!?]/g) ?? []).length, 2),
  );
  const setup = sat(countMatches(text, SETUP_CUES), 1);
  const tension = sat(countMatches(text, TENSION_CUES), 1.5);
  const payoff = sat(countMatches(text, PAYOFF_CUES), 1);

  // A clip that opens with a bare pronoun/conjunction likely depends on prior
  // context, so it scores lower on context-independence.
  const dependent = DEPENDENT_OPENERS.some((d) => opener.toLowerCase().startsWith(d));
  const contextIndependence = clamp01((dependent ? 0.35 : 0.8) + (words > 12 ? 0.1 : 0));

  const storyQuality = clamp01(0.4 * setup + 0.3 * payoff + 0.3 * ctx.lexicalRichness);
  const visualInterest = clamp01(ctx.visualMotion);
  const audioIntensity = clamp01(ctx.audioIntensity);

  // Novelty here is a within-clip lexical-richness proxy; cross-clip novelty is
  // enforced separately by diversity selection.
  const novelty = clamp01(ctx.lexicalRichness);

  // Rewatchable clips tend to be punchy (not too long) with a strong payoff.
  const brevity = clamp01(1 - Math.abs(ctx.durationSec - 25) / 40);
  const rewatchPotential = clamp01(0.4 * payoff + 0.3 * emotionalIntensity + 0.3 * brevity);

  return {
    hookStrength,
    emotionalIntensity,
    curiosity,
    setup,
    tension,
    payoff,
    contextIndependence,
    storyQuality,
    visualInterest,
    audioIntensity,
    novelty,
    rewatchPotential,
  };
}

/** Base weights (before content-type adjustment) for aggregating signals. */
export const BASE_WEIGHTS: Record<keyof CandidateSignals, number> = {
  hookStrength: 1.6,
  emotionalIntensity: 1.3,
  curiosity: 1.2,
  setup: 0.8,
  tension: 1.0,
  payoff: 1.4,
  contextIndependence: 1.3,
  storyQuality: 1.2,
  visualInterest: 0.7,
  audioIntensity: 0.7,
  novelty: 0.6,
  rewatchPotential: 1.2,
};

/** Aggregate signals into a 0..100 score using base × content-type weights. */
export function aggregateScore(
  signals: CandidateSignals,
  weightMultipliers: Partial<Record<string, number>> = {},
): number {
  let total = 0;
  let weightSum = 0;
  for (const key of Object.keys(BASE_WEIGHTS) as (keyof CandidateSignals)[]) {
    const w = BASE_WEIGHTS[key] * (weightMultipliers[key] ?? 1);
    total += signals[key] * w;
    weightSum += w;
  }
  return Math.round((total / weightSum) * 1000) / 10; // one decimal, 0..100
}
