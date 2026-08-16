import type { CandidateSignals, ContentType } from "../types";
import { cosineSimilarity } from "../ai/embedding";
import { contentTypeWeights } from "./contentType";
import { aggregateScore, scoreSignals } from "./signals";
import { segmentSentences, wordsToText, type Segment } from "./text";
import type { TranscriptWord } from "../types";

export interface CandidateWindow {
  start: number;
  end: number;
  text: string;
  words: TranscriptWord[];
  signals: CandidateSignals;
  score: number;
}

export interface DiscoveryOptions {
  minClipSec: number;
  maxClipSec: number;
  contentType: ContentType;
  audioIntensityAt: (start: number, end: number) => number;
  visualMotionAt: (start: number, end: number) => number;
  /** Hard cap on how many candidates to generate before ranking. */
  maxCandidates?: number;
}

function lexicalRichness(text: string): number {
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const unique = new Set(tokens).size;
  return Math.max(0, Math.min(1, unique / tokens.length));
}

/**
 * Over-generate candidate windows by growing runs of consecutive sentence
 * segments until they land inside the target duration band. This deliberately
 * produces far more candidates than we need (the spec's 100 → 50 → 20 → 10 → 5
 * funnel starts here); ranking and selection prune them down.
 */
export function discoverCandidates(
  words: TranscriptWord[],
  opts: DiscoveryOptions,
): CandidateWindow[] {
  const segments = segmentSentences(words);
  const windows: CandidateWindow[] = [];
  const weights = contentTypeWeights(opts.contentType);

  const makeWindow = (segs: Segment[]): CandidateWindow | null => {
    if (segs.length === 0) return null;
    const start = segs[0].start;
    const end = segs[segs.length - 1].end;
    const duration = end - start;
    if (duration < opts.minClipSec || duration > opts.maxClipSec) return null;
    const winWords = segs.flatMap((s) => s.words);
    const text = wordsToText(winWords);
    const signals = scoreSignals({
      text,
      opener: segs[0].text,
      durationSec: duration,
      audioIntensity: opts.audioIntensityAt(start, end),
      visualMotion: opts.visualMotionAt(start, end),
      lexicalRichness: lexicalRichness(text),
    });
    const score = aggregateScore(signals, weights);
    return { start, end, text, words: winWords, signals, score };
  };

  for (let i = 0; i < segments.length; i++) {
    const run: Segment[] = [];
    for (let j = i; j < segments.length; j++) {
      run.push(segments[j]);
      const duration = segments[j].end - segments[i].start;
      if (duration >= opts.minClipSec) {
        const win = makeWindow(run.slice());
        if (win) windows.push(win);
      }
      if (duration > opts.maxClipSec) break;
    }
  }

  // De-duplicate identical spans and cap the count, keeping the best by score.
  const seen = new Set<string>();
  const unique = windows.filter((w) => {
    const key = `${w.start.toFixed(2)}-${w.end.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => b.score - a.score);
  const cap = opts.maxCandidates ?? 100;
  return unique.slice(0, cap);
}

/**
 * Greedy near-duplicate removal. Walking candidates from best to worst, we drop
 * any whose embedding is too similar to one we've already kept — this prevents
 * five clips of the same moment. Returns which survivors each dropped candidate
 * duplicates.
 */
export function removeDuplicates(
  ranked: { id: string; embedding: number[]; score: number }[],
  threshold = 0.85,
): { keptIds: string[]; duplicateOf: Map<string, string> } {
  const kept: { id: string; embedding: number[] }[] = [];
  const duplicateOf = new Map<string, string>();
  for (const cand of ranked) {
    let dupTarget: string | null = null;
    for (const k of kept) {
      if (cosineSimilarity(cand.embedding, k.embedding) >= threshold) {
        dupTarget = k.id;
        break;
      }
    }
    if (dupTarget) duplicateOf.set(cand.id, dupTarget);
    else kept.push({ id: cand.id, embedding: cand.embedding });
  }
  return { keptIds: kept.map((k) => k.id), duplicateOf };
}

/**
 * Maximal-marginal-relevance selection: pick the final set by balancing raw
 * score against dissimilarity to already-selected clips (lambda controls the
 * trade-off). This yields a diverse final set rather than N variations on the
 * single highest-scoring topic.
 */
export function selectDiverse(
  candidates: { id: string; embedding: number[]; score: number }[],
  count: number,
  lambda = 0.7,
): string[] {
  if (candidates.length === 0) return [];
  const maxScore = Math.max(...candidates.map((c) => c.score)) || 1;
  const pool = candidates.slice();
  const selected: typeof candidates = [];

  while (selected.length < count && pool.length > 0) {
    let bestIdx = 0;
    let bestMmr = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const rel = pool[i].score / maxScore;
      const maxSim = selected.length
        ? Math.max(...selected.map((s) => cosineSimilarity(pool[i].embedding, s.embedding)))
        : 0;
      const mmr = lambda * rel - (1 - lambda) * maxSim;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }
    selected.push(pool[bestIdx]);
    pool.splice(bestIdx, 1);
  }
  return selected.map((s) => s.id);
}
