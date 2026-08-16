import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateSampleVideo } from "./media/mediaEngine";
import type { TranscriptWord } from "./types";

/** Self-contained, punchy lines that give the intelligence stages real material. */
export const SAMPLE_SENTENCES = [
  "Here's why most short form videos fail in the first three seconds.",
  "The biggest mistake creators make is burying the hook at the end.",
  "Did you know ninety percent of viewers decide to keep watching almost instantly?",
  "Let me tell you the secret that changed how I edit every single clip.",
  "I struggled for two years before I finally understood pacing and rhythm.",
  "The turning point came when I stopped chasing views and started chasing retention.",
  "What if a single caption could double the watch time of your video?",
  "The truth is that great editing is mostly about ruthless removal of dead space.",
  "So I tested one hundred different hooks and the results genuinely shocked me.",
  "Nobody talks about how silence between words quietly kills your momentum.",
  "In the end, the clips that performed best were the ones that felt effortless.",
  "The lesson here is simple: earn attention first, then deliver the payoff.",
  "This is why I always start editing from the strongest emotional moment.",
  "Everyone thinks you need expensive gear, but the story matters far more.",
  "Finally, remember that rewatchable clips are built, not discovered by luck.",
];

export interface SampleTranscript {
  words: TranscriptWord[];
  duration: number;
}

/** Build a word-level transcript with evenly spaced timings from sentences. */
export function buildSampleTranscript(sentences: string[] = SAMPLE_SENTENCES): SampleTranscript {
  const words: TranscriptWord[] = [];
  let t = 0.5;
  const wordDur = 0.32;
  const gap = 0.5;
  for (const sentence of sentences) {
    for (const tok of sentence.split(/\s+/)) {
      words.push({
        word: tok,
        start: Math.round(t * 100) / 100,
        end: Math.round((t + wordDur) * 100) / 100,
      });
      t += wordDur + 0.03;
    }
    t += gap;
  }
  return { words, duration: Math.ceil(t + 1) };
}

/** Generate a sample video file on disk and return its path + transcript. */
export async function makeSampleVideoFile(): Promise<{
  filePath: string;
  transcript: SampleTranscript;
  cleanup: () => Promise<void>;
}> {
  const transcript = buildSampleTranscript();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "clip-sample-"));
  const filePath = path.join(dir, "sample.mp4");
  await generateSampleVideo(filePath, transcript.duration);
  return {
    filePath,
    transcript,
    cleanup: () => fs.rm(dir, { recursive: true, force: true }),
  };
}
