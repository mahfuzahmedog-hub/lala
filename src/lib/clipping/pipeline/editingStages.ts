import { optimizeBoundaries } from "../intelligence/boundary";
import { generateHook } from "../intelligence/hook";
import { buildCaptions } from "../intelligence/captions";
import { wordsInRange } from "../intelligence/text";
import { nowIso } from "../ids";
import { renderClipVersion } from "./render";
import { requireVideo, type Stage } from "./types";

/** Snap each selected clip to clean, word-aligned, silence-trimmed boundaries. */
export const boundaryStage: Stage = {
  name: "boundary_optimization",
  async run(s) {
    const clips = await s.ctx.db.clips.list((c) => c.videoId === s.videoId);
    const transcript = await s.ctx.db.transcripts.get(`transcript_${s.videoId}`);
    const analysis = await s.ctx.db.videoAnalyses.get(`analysis_${s.videoId}`);
    if (!transcript) throw new Error("transcript missing for boundary optimization");

    for (const clip of clips) {
      const words = transcript.words;
      const { start, end } = optimizeBoundaries({
        start: clip.start,
        end: clip.end,
        words,
        silences: analysis?.audio?.silences ?? [],
        scenes: analysis?.scenes ?? [],
        minClipSec: s.settings.minClipSec,
        maxClipSec: s.settings.maxClipSec,
      });
      await s.ctx.db.clips.update(clip.id, { start, end, updatedAt: nowIso() });
    }
    await s.log("info", `optimized boundaries for ${clips.length} clip(s)`);
  },
};

/** Generate an extractive hook line for each clip (never fabricated). */
export const hookStage: Stage = {
  name: "hook_optimization",
  async run(s) {
    const clips = await s.ctx.db.clips.list((c) => c.videoId === s.videoId);
    const transcript = await s.ctx.db.transcripts.get(`transcript_${s.videoId}`);
    if (!transcript) throw new Error("transcript missing for hook optimization");
    for (const clip of clips) {
      const words = wordsInRange(transcript.words, clip.start, clip.end);
      const hook = generateHook(words);
      await s.ctx.db.clips.update(clip.id, { hook, updatedAt: nowIso() });
    }
    await s.log("info", `generated hooks for ${clips.length} clip(s)`);
  },
};

/**
 * Decide the horizontal reframe focus for each clip. Without a face detector we
 * default to a centered crop, but this is the seam where speaker/face tracking
 * would set a per-clip focus point.
 */
export const reframeStage: Stage = {
  name: "auto_reframe",
  async run(s) {
    const video = await requireVideo(s);
    const clips = await s.ctx.db.clips.list((c) => c.videoId === s.videoId);
    const focusX = 0.5;
    for (const clip of clips) {
      await s.ctx.db.clips.update(clip.id, { focusX, updatedAt: nowIso() });
    }
    const wide = video.width && video.height ? video.width > video.height : false;
    await s.log(
      "info",
      `reframing ${clips.length} clip(s) to ${clips[0]?.aspectRatio ?? "9:16"}` +
        (wide ? " (cropping a landscape source)" : ""),
    );
  },
};

/** Build word-level caption cues for each clip (also used for preview). */
export const captionStage: Stage = {
  name: "captions",
  async run(s) {
    const clips = await s.ctx.db.clips.list((c) => c.videoId === s.videoId);
    const transcript = await s.ctx.db.transcripts.get(`transcript_${s.videoId}`);
    if (!transcript) throw new Error("transcript missing for captions");
    for (const clip of clips) {
      const words = wordsInRange(transcript.words, clip.start, clip.end);
      const captions = buildCaptions(words);
      await s.ctx.db.clips.update(clip.id, { captions, updatedAt: nowIso() });
    }
    await s.log("info", `built captions for ${clips.length} clip(s)`);
  },
};

/** Render the first version of every clip with FFmpeg. */
export const renderStage: Stage = {
  name: "render",
  async run(s) {
    const clips = await s.ctx.db.clips.list((c) => c.videoId === s.videoId);
    let rendered = 0;
    for (const clip of clips) {
      if (clip.currentVersion > 0) continue; // resumable: already rendered
      await s.ctx.db.clips.update(clip.id, { status: "rendering", updatedAt: nowIso() });
      const fresh = await s.ctx.db.clips.get(clip.id);
      if (fresh) {
        await renderClipVersion(s, fresh);
        rendered++;
      }
    }
    await s.log("info", `rendered ${rendered} clip(s)`);
  },
};
