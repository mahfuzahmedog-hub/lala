import test from "node:test";
import assert from "node:assert/strict";
import {
  HashingEmbeddingProvider,
  cosineSimilarity,
} from "../ai/embedding";
import {
  discoverCandidates,
  removeDuplicates,
  selectDiverse,
} from "../intelligence/candidates";
import { aggregateScore, scoreSignals } from "../intelligence/signals";
import { buildCaptions } from "../intelligence/captions";
import { reviewClip } from "../intelligence/quality";
import { optimizeBoundaries } from "../intelligence/boundary";
import { detectContentType } from "../intelligence/contentType";
import type { TranscriptWord } from "../types";

function makeWords(sentences: string[]): TranscriptWord[] {
  const words: TranscriptWord[] = [];
  let t = 0;
  for (const s of sentences) {
    for (const tok of s.split(/\s+/)) {
      words.push({ word: tok, start: t, end: t + 0.3 });
      t += 0.35;
    }
    t += 0.5;
  }
  return words;
}

test("hashing embeddings: similar text is closer than dissimilar text", async () => {
  const p = new HashingEmbeddingProvider();
  const [a, b, c] = await p.embed([
    "the cat sat on the warm mat",
    "a cat was sitting on a mat",
    "quarterly revenue growth exceeded market expectations",
  ]);
  const simAB = cosineSimilarity(a, b);
  const simAC = cosineSimilarity(a, c);
  assert.ok(simAB > simAC, `expected ${simAB} > ${simAC}`);
});

test("aggregateScore stays within 0..100", () => {
  const signals = scoreSignals({
    text: "here's why this is the biggest secret nobody talks about",
    opener: "here's why this is the biggest secret",
    durationSec: 20,
    audioIntensity: 0.8,
    visualMotion: 0.6,
    lexicalRichness: 0.9,
  });
  const score = aggregateScore(signals);
  assert.ok(score >= 0 && score <= 100, `score ${score} out of range`);
});

test("discoverCandidates respects the duration band", () => {
  const words = makeWords([
    "Here's why short videos fail in the first three seconds every single time.",
    "The biggest mistake is burying the hook far too late in the story.",
    "Did you know most viewers decide almost instantly whether they will stay?",
    "Finally the lesson is to earn attention first and then deliver the payoff.",
  ]);
  const cands = discoverCandidates(words, {
    minClipSec: 3,
    maxClipSec: 12,
    contentType: "education",
    audioIntensityAt: () => 0.6,
    visualMotionAt: () => 0.5,
  });
  assert.ok(cands.length > 0, "expected some candidates");
  for (const c of cands) {
    const dur = c.end - c.start;
    assert.ok(dur >= 3 - 1e-6 && dur <= 12 + 1e-6, `duration ${dur} out of band`);
  }
});

test("removeDuplicates drops near-identical embeddings", () => {
  const ranked = [
    { id: "a", embedding: [1, 0, 0], score: 90 },
    { id: "b", embedding: [1, 0, 0], score: 80 }, // duplicate of a
    { id: "c", embedding: [0, 1, 0], score: 70 },
  ];
  const { keptIds, duplicateOf } = removeDuplicates(ranked, 0.85);
  assert.deepEqual(keptIds.sort(), ["a", "c"]);
  assert.equal(duplicateOf.get("b"), "a");
});

test("selectDiverse returns the requested count and avoids clones", () => {
  const cands = [
    { id: "a", embedding: [1, 0, 0], score: 95 },
    { id: "b", embedding: [0.99, 0.01, 0], score: 94 },
    { id: "c", embedding: [0, 1, 0], score: 60 },
  ];
  const chosen = selectDiverse(cands, 2, 0.6);
  assert.equal(chosen.length, 2);
  assert.ok(chosen.includes("a"));
  assert.ok(chosen.includes("c"), "should prefer a diverse second pick over a near-clone");
});

test("buildCaptions groups words into cues", () => {
  const words = makeWords(["one two three four five six seven eight nine ten"]);
  const cues = buildCaptions(words, { maxWordsPerCue: 3, maxCueSec: 10, pauseBreakSec: 5 });
  assert.ok(cues.length >= 3);
  for (const cue of cues) assert.ok(cue.words.length <= 3);
});

test("optimizeBoundaries trims a leading silence and aligns to words", () => {
  const words = makeWords(["hello world this is a complete sentence about editing"]);
  const res = optimizeBoundaries({
    start: 0,
    end: words[words.length - 1].end + 1,
    words,
    silences: [{ start: 0, end: 0.2 }],
    scenes: [],
    minClipSec: 1,
    maxClipSec: 60,
  });
  assert.ok(res.start >= 0);
  assert.ok(res.end <= words[words.length - 1].end + 1e-6);
});

test("reviewClip verdict follows thresholds", () => {
  const strong = reviewClip({
    signals: scoreSignals({
      text: "here's why the biggest secret finally pays off in the end",
      opener: "here's why the biggest secret",
      durationSec: 22,
      audioIntensity: 0.9,
      visualMotion: 0.8,
      lexicalRichness: 0.95,
    }),
    durationSec: 22,
    wordCount: 60,
    captionCoverage: 0.95,
    hasAudio: true,
    audioIntensity: 0.9,
    endsCleanly: true,
    framing: 0.9,
    acceptThreshold: 85,
    rejectThreshold: 70,
  });
  assert.ok(["accept", "reedit"].includes(strong.verdict));

  const weak = reviewClip({
    signals: scoreSignals({
      text: "and then it was that",
      opener: "and then it",
      durationSec: 55,
      audioIntensity: 0,
      visualMotion: 0,
      lexicalRichness: 0.2,
    }),
    durationSec: 55,
    wordCount: 5,
    captionCoverage: 0.2,
    hasAudio: false,
    audioIntensity: 0,
    endsCleanly: false,
    framing: 0.4,
    acceptThreshold: 85,
    rejectThreshold: 70,
  });
  assert.equal(weak.verdict, "reject");
});

test("detectContentType picks a plausible type", () => {
  const res = detectContentType(
    "in this tutorial the first step is to install the package then click next to setup",
  );
  assert.equal(res.contentType, "tutorial");
  assert.ok(res.confidence > 0);
});
