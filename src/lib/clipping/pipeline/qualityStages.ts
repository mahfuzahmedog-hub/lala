import { reviewClip, type QualityInput } from "../intelligence/quality";
import { segmentSentences, wordsInRange } from "../intelligence/text";
import { newId, nowIso } from "../ids";
import { renderClipVersion } from "./render";
import { intensityAccessor, requireVideo, type Stage, type StageServices } from "./types";
import type { Analytics, Clip, ClipCandidate, QualityReview, TranscriptWord, Video, VideoAnalysis } from "../types";

/** Assemble the inputs the quality critic needs for a clip's current version. */
function buildReviewInput(
  clip: Clip,
  candidate: ClipCandidate,
  video: Video,
  analysis: VideoAnalysis | null,
  words: TranscriptWord[],
  acceptThreshold: number,
  rejectThreshold: number,
): QualityInput {
  const durationSec = Math.max(0.1, clip.end - clip.start);
  const captionCoverage =
    clip.captions.reduce((a, c) => a + (c.end - c.start), 0) / durationSec;
  const audioAt = intensityAccessor(analysis?.audio?.windows);
  const last = words[words.length - 1];
  const endsCleanly = last ? /[.!?]$/.test(last.word.trim()) : false;
  const minDim = video.width && video.height ? Math.min(video.width, video.height) : 0;
  const framing = !video.width ? 0.4 : minDim >= 720 ? 0.9 : 0.7;
  return {
    signals: candidate.signals,
    durationSec,
    wordCount: words.length,
    captionCoverage: Math.max(0, Math.min(1, captionCoverage)),
    hasAudio: Boolean(video.hasAudio),
    audioIntensity: audioAt(clip.start, clip.end),
    endsCleanly,
    framing,
    acceptThreshold,
    rejectThreshold,
  };
}

/**
 * Adjust a clip's boundaries in response to a re-edit diagnosis. Each branch is
 * a small, targeted change (build spec: "Re-edit failures according to the
 * diagnosed problem") rather than a blind re-render.
 */
function applyDiagnosis(
  clip: Clip,
  diagnosis: string,
  words: TranscriptWord[],
  minSec: number,
  maxSec: number,
  videoDuration: number,
): { start: number; end: number } {
  const segments = segmentSentences(words);
  let { start, end } = clip;

  if (diagnosis === "extend-to-sentence-end") {
    const after = segments.find((seg) => seg.end > end - 0.2);
    if (after) end = Math.min(videoDuration, Math.max(end, after.end));
    if (end - start > maxSec) end = start + maxSec;
  } else if (diagnosis === "start-at-stronger-hook") {
    const horizon = start + (end - start) * 0.6;
    const inWindow = segments.filter((seg) => seg.start >= start && seg.start <= horizon);
    if (inWindow.length > 1) {
      const candidateStart = inWindow[1].start; // skip a weak opening sentence
      if (end - candidateStart >= minSec) start = candidateStart;
    }
  } else if (diagnosis === "tighten-boundaries") {
    const inside = segments.filter((seg) => seg.start >= start - 0.2 && seg.end <= end + 0.2);
    if (inside.length >= 1) {
      const ns = inside[0].start;
      const ne = inside[inside.length - 1].end;
      if (ne - ns >= minSec) {
        start = ns;
        end = ne;
      }
    }
  }
  // "rebuild-captions" leaves boundaries untouched; the re-render rebuilds them.
  return { start: Math.max(0, start), end };
}

/**
 * Review every rendered clip. Accept, reject, or re-edit-and-re-render up to the
 * configured retry cap. Accepted clips get an Analytics row seeded with the
 * predicted quality score (used later to compare prediction vs. reality).
 */
export const qualityStage: Stage = {
  name: "quality_critic",
  async run(s: StageServices) {
    const video = await requireVideo(s);
    const analysis = await s.ctx.db.videoAnalyses.get(`analysis_${s.videoId}`);
    const transcript = await s.ctx.db.transcripts.get(`transcript_${s.videoId}`);
    const clips = await s.ctx.db.clips.list((c) => c.videoId === s.videoId);

    for (const initial of clips) {
      if (["accepted", "rejected", "exported"].includes(initial.status)) continue;
      let clip = initial;
      const candidate = await s.ctx.db.candidates.get(clip.candidateId);
      if (!candidate) continue;

      const reviewOnce = async (): Promise<QualityReview> => {
        const words = transcript ? wordsInRange(transcript.words, clip.start, clip.end) : [];
        const input = buildReviewInput(
          clip,
          candidate,
          video,
          analysis,
          words,
          s.settings.qualityAcceptThreshold,
          s.settings.qualityRejectThreshold,
        );
        const result = reviewClip(input);
        const review: QualityReview = {
          id: newId("qr"),
          clipId: clip.id,
          version: clip.currentVersion,
          overall: result.overall,
          verdict: result.verdict,
          dimensions: result.dimensions,
          diagnosis: result.diagnosis,
          createdAt: nowIso(),
        };
        await s.ctx.db.qualityReviews.create(review);
        return review;
      };

      let review = await reviewOnce();
      let attempts = 0;
      while (review.verdict === "reedit" && attempts < s.settings.maxReeditRetries) {
        attempts++;
        const words = transcript ? wordsInRange(transcript.words, clip.start, clip.end) : [];
        const { start, end } = applyDiagnosis(
          clip,
          review.diagnosis ?? "tighten-boundaries",
          transcript ? transcript.words : words,
          s.settings.minClipSec,
          s.settings.maxClipSec,
          video.durationSec ?? clip.end,
        );
        await s.ctx.db.clips.update(clip.id, { start, end, status: "reedit", updatedAt: nowIso() });
        const refreshed = await s.ctx.db.clips.get(clip.id);
        if (!refreshed) break;
        clip = await renderClipVersion(s, refreshed);
        review = await reviewOnce();
        await s.log(
          "info",
          `re-edit #${attempts} of ${clip.id}: ${review.diagnosis ?? "-"} → ${review.overall}`,
        );
      }

      const accepted =
        review.verdict === "accept" ||
        (review.verdict === "reedit" && review.overall >= s.settings.qualityRejectThreshold);
      const finalStatus = accepted ? "accepted" : "rejected";
      await s.ctx.db.clips.update(clip.id, {
        status: finalStatus,
        score: review.overall,
        updatedAt: nowIso(),
      });

      if (accepted) {
        const analytics: Analytics = {
          id: `analytics_${clip.id}`,
          clipId: clip.id,
          views: 0,
          likes: 0,
          shares: 0,
          watchThroughRate: 0,
          predictedScore: review.overall,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        if (!(await s.ctx.db.analytics.get(analytics.id))) {
          await s.ctx.db.analytics.create(analytics);
        }
      }
    }

    const finalClips = await s.ctx.db.clips.list((c) => c.videoId === s.videoId);
    const acceptedCount = finalClips.filter((c) => c.status === "accepted").length;
    await s.log("info", `quality review complete: ${acceptedCount}/${finalClips.length} accepted`);
  },
};

/** Mark the video ready once all clips are reviewed. */
export const finalizeStage: Stage = {
  name: "finalize",
  async run(s) {
    await s.ctx.db.videos.update(s.videoId, { status: "ready", updatedAt: nowIso() });
    await s.log("info", "pipeline complete; video marked ready");
  },
};
