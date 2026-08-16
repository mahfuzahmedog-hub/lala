import { discoverCandidates, removeDuplicates, selectDiverse } from "../intelligence/candidates";
import { newId, nowIso } from "../ids";
import type { Clip, ClipCandidate } from "../types";
import {
  intensityAccessor,
  motionAccessor,
  requireVideo,
  type Stage,
} from "./types";

/** Over-generate scored candidate windows from the transcript + analysis. */
export const discoveryStage: Stage = {
  name: "candidate_discovery",
  async run(s) {
    const existing = await s.ctx.db.candidates.list((c) => c.videoId === s.videoId);
    if (existing.length > 0) {
      await s.log("info", `candidates already exist (${existing.length}), skipping discovery`);
      return;
    }
    const transcript = await s.ctx.db.transcripts.get(`transcript_${s.videoId}`);
    if (!transcript) throw new Error("transcript missing for candidate discovery");
    const analysis = await s.ctx.db.videoAnalyses.get(`analysis_${s.videoId}`);

    const audioAt = intensityAccessor(analysis?.audio?.windows);
    const motionAt = motionAccessor(analysis?.visual?.windows);

    const windows = discoverCandidates(transcript.words, {
      minClipSec: s.settings.minClipSec,
      maxClipSec: s.settings.maxClipSec,
      contentType: analysis?.contentType ?? "unknown",
      audioIntensityAt: audioAt,
      visualMotionAt: motionAt,
      maxCandidates: 100,
    });

    for (const w of windows) {
      const candidate: ClipCandidate = {
        id: newId("cand"),
        videoId: s.videoId,
        start: w.start,
        end: w.end,
        text: w.text,
        signals: w.signals,
        score: w.score,
        embedding: [],
        selected: false,
        createdAt: nowIso(),
      };
      await s.ctx.db.candidates.create(candidate);
    }
    await s.log("info", `discovered ${windows.length} candidate(s)`);
  },
};

/** Compute embeddings for all candidates (used by later dedupe/diversity). */
export const rankingStage: Stage = {
  name: "candidate_ranking",
  async run(s) {
    const candidates = await s.ctx.db.candidates.list((c) => c.videoId === s.videoId);
    const needEmbedding = candidates.filter((c) => c.embedding.length === 0);
    if (needEmbedding.length > 0) {
      const vectors = await s.ctx.embedding.embed(needEmbedding.map((c) => c.text));
      for (let i = 0; i < needEmbedding.length; i++) {
        await s.ctx.db.candidates.update(needEmbedding[i].id, { embedding: vectors[i] });
      }
    }
    const ranked = [...candidates].sort((a, b) => b.score - a.score);
    await s.log(
      "info",
      `ranked ${candidates.length} candidate(s); top score ${ranked[0]?.score ?? 0}`,
    );
  },
};

/** Mark near-duplicate candidates so the same moment isn't picked twice. */
export const duplicateStage: Stage = {
  name: "duplicate_removal",
  async run(s) {
    const candidates = (await s.ctx.db.candidates.list((c) => c.videoId === s.videoId)).sort(
      (a, b) => b.score - a.score,
    );
    const { keptIds, duplicateOf } = removeDuplicates(
      candidates.map((c) => ({ id: c.id, embedding: c.embedding, score: c.score })),
    );
    for (const c of candidates) {
      const dup = duplicateOf.get(c.id);
      await s.ctx.db.candidates.update(c.id, { duplicateOf: dup ?? undefined });
    }
    await s.log("info", `kept ${keptIds.length} unique candidate(s) after dedupe`);
  },
};

/** Select the final diverse set and materialise a Clip per selection. */
export const diversityStage: Stage = {
  name: "diversity_selection",
  async run(s) {
    const video = await requireVideo(s);
    const candidates = await s.ctx.db.candidates.list(
      (c) => c.videoId === s.videoId && !c.duplicateOf,
    );
    const selectedIds = selectDiverse(
      candidates.map((c) => ({ id: c.id, embedding: c.embedding, score: c.score })),
      s.settings.targetClipCount,
    );
    const aspect = s.settings.defaultAspectRatios[0] ?? "9:16";

    for (const c of candidates) {
      const isSelected = selectedIds.includes(c.id);
      await s.ctx.db.candidates.update(c.id, { selected: isSelected });
      if (!isSelected) continue;

      const clipId = `clip_${c.id}`;
      if (await s.ctx.db.clips.get(clipId)) continue; // resumable: already created
      const clip: Clip = {
        id: clipId,
        videoId: s.videoId,
        candidateId: c.id,
        projectId: video.projectId,
        title: c.text.split(/\s+/).slice(0, 8).join(" "),
        hook: "",
        aspectRatio: aspect,
        start: c.start,
        end: c.end,
        status: "pending",
        currentVersion: 0,
        versions: [],
        captions: [],
        score: c.score,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await s.ctx.db.clips.create(clip);
    }
    await s.log("info", `selected ${selectedIds.length} final clip(s)`);
  },
};
