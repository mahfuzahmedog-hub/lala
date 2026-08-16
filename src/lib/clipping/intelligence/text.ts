import type { TranscriptWord } from "../types";

export interface Segment {
  start: number;
  end: number;
  words: TranscriptWord[];
  text: string;
}

/** Join words into readable text, collapsing spacing around punctuation. */
export function wordsToText(words: TranscriptWord[]): string {
  return words
    .map((w) => w.word)
    .join(" ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words whose midpoint falls inside [start, end]. */
export function wordsInRange(
  words: TranscriptWord[],
  start: number,
  end: number,
): TranscriptWord[] {
  return words.filter((w) => {
    const mid = (w.start + w.end) / 2;
    return mid >= start && mid <= end;
  });
}

export function textInRange(
  words: TranscriptWord[],
  start: number,
  end: number,
): string {
  return wordsToText(wordsInRange(words, start, end));
}

/**
 * Split a word stream into sentence-like segments. We break on terminal
 * punctuation and also on long pauses between words (a natural spoken-sentence
 * boundary), which keeps segments coherent even when punctuation is missing.
 */
export function segmentSentences(words: TranscriptWord[], pauseSec = 0.8): Segment[] {
  const segments: Segment[] = [];
  let current: TranscriptWord[] = [];

  const flush = () => {
    if (current.length === 0) return;
    segments.push({
      start: current[0].start,
      end: current[current.length - 1].end,
      words: current,
      text: wordsToText(current),
    });
    current = [];
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    current.push(w);
    const endsSentence = /[.!?]$/.test(w.word.trim());
    const next = words[i + 1];
    const bigPause = next ? next.start - w.end >= pauseSec : false;
    if (endsSentence || bigPause) flush();
  }
  flush();
  return segments;
}
