import type { CandidateSignals, QualityDimensionScore, QualityVerdict } from "../types";

export interface QualityInput {
  signals: CandidateSignals;
  durationSec: number;
  wordCount: number;
  /** Fraction of the clip covered by caption cues (0..1). */
  captionCoverage: number;
  hasAudio: boolean;
  audioIntensity: number;
  /** Whether the final word ends on terminal punctuation. */
  endsCleanly: boolean;
  /** Framing quality 0..1 (source resolution vs. target etc.). */
  framing: number;
  acceptThreshold: number;
  rejectThreshold: number;
}

export interface QualityResult {
  overall: number;
  verdict: QualityVerdict;
  dimensions: QualityDimensionScore[];
  diagnosis?: string;
}

const pct = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 100);

/**
 * Score a rendered clip across the ten dimensions from the spec and turn the
 * overall into an Accept / Re-edit / Reject verdict. When the verdict is
 * Re-edit, we attach a diagnosis naming the weakest dimension so the pipeline
 * can apply a *targeted* fix rather than blindly re-rendering.
 */
export function reviewClip(input: QualityInput): QualityResult {
  const { signals } = input;

  // Pacing: aim for ~2–3.5 words/sec; punish very slow or very fast.
  const wps = input.wordCount / Math.max(1, input.durationSec);
  const pacing = 1 - Math.min(1, Math.abs(wps - 2.7) / 2.7);

  const dimensions: QualityDimensionScore[] = [
    { name: "hook", score: pct(signals.hookStrength), notes: "Strength of the opening line." },
    { name: "context", score: pct(signals.contextIndependence), notes: "Stands alone without prior context." },
    { name: "pacing", score: pct(pacing), notes: `~${wps.toFixed(1)} words/sec.` },
    {
      name: "audio",
      score: pct(input.hasAudio ? 0.4 + 0.6 * input.audioIntensity : 0.2),
      notes: input.hasAudio ? "Audio present and dynamic." : "No audio track.",
    },
    { name: "captions", score: pct(input.captionCoverage), notes: "Caption time coverage." },
    { name: "framing", score: pct(input.framing), notes: "Reframing to target aspect ratio." },
    { name: "story", score: pct(signals.storyQuality), notes: "Narrative completeness." },
    { name: "payoff", score: pct(signals.payoff), notes: "Presence of a resolution/payoff." },
    {
      name: "ending",
      score: pct(input.endsCleanly ? 0.85 : 0.45),
      notes: input.endsCleanly ? "Ends on a complete thought." : "Ends mid-thought.",
    },
    { name: "rewatchability", score: pct(signals.rewatchPotential), notes: "Rewatch potential." },
  ];

  // Weighted overall — hook, payoff, and story matter most for short-form.
  const weights: Record<string, number> = {
    hook: 1.6,
    context: 1.2,
    pacing: 1.0,
    audio: 0.8,
    captions: 1.0,
    framing: 0.8,
    story: 1.3,
    payoff: 1.4,
    ending: 1.1,
    rewatchability: 1.3,
  };
  let total = 0;
  let weightSum = 0;
  for (const d of dimensions) {
    const w = weights[d.name] ?? 1;
    total += d.score * w;
    weightSum += w;
  }
  const overall = Math.round((total / weightSum) * 10) / 10;

  let verdict: QualityVerdict;
  if (overall >= input.acceptThreshold) verdict = "accept";
  else if (overall >= input.rejectThreshold) verdict = "reedit";
  else verdict = "reject";

  let diagnosis: string | undefined;
  if (verdict === "reedit") {
    const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
    diagnosis = diagnosisFor(weakest.name);
  }

  return { overall, verdict, dimensions, diagnosis };
}

/** Map the weakest dimension to a concrete, actionable re-edit instruction. */
export function diagnosisFor(dimension: string): string {
  switch (dimension) {
    case "ending":
      return "extend-to-sentence-end";
    case "hook":
      return "start-at-stronger-hook";
    case "context":
      return "start-at-stronger-hook";
    case "captions":
      return "rebuild-captions";
    case "pacing":
      return "tighten-boundaries";
    default:
      return "tighten-boundaries";
  }
}
