import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  analyzeAudio,
  analyzeVisual,
  detectScenes,
  extractThumbnail,
  probe,
} from "../media/mediaEngine";
import { detectContentType } from "../intelligence/contentType";
import { wordsToText } from "../intelligence/text";
import { newId, nowIso } from "../ids";
import type { Speaker, Transcript } from "../types";
import {
  getOrCreateAnalysis,
  requireVideo,
  saveAnalysis,
  type Stage,
} from "./types";

/** Probe container metadata and grab a thumbnail. */
export const probeStage: Stage = {
  name: "probe",
  async run(s) {
    const video = await requireVideo(s);
    const src = await s.ctx.storage.localPath(video.storageKey);
    const meta = await probe(src);
    await s.ctx.db.videos.update(video.id, {
      durationSec: meta.durationSec,
      width: meta.width,
      height: meta.height,
      fps: meta.fps,
      videoCodec: meta.videoCodec,
      audioCodec: meta.audioCodec,
      hasAudio: meta.hasAudio,
      status: "processing",
      updatedAt: nowIso(),
    });
    await getOrCreateAnalysis(s);

    if (meta.width && meta.height) {
      const thumbKey = `videos/${video.id}/thumbnail.jpg`;
      const tmp = path.join(os.tmpdir(), `${video.id}-thumb.jpg`);
      try {
        await extractThumbnail(src, Math.min(1, meta.durationSec / 2), tmp);
        await s.ctx.storage.writeFromFile(thumbKey, tmp);
        await s.ctx.db.videos.update(video.id, { thumbnailKey: thumbKey });
        await fs.rm(tmp, { force: true });
      } catch (err) {
        await s.log("warn", `thumbnail failed: ${(err as Error).message}`);
      }
    }
    await s.log("info", `probed: ${meta.durationSec.toFixed(1)}s, audio=${meta.hasAudio}`);
  },
};

/** Turn speech into a word-level transcript via the configured provider. */
export const transcriptionStage: Stage = {
  name: "transcription",
  async run(s) {
    const video = await requireVideo(s);
    const existing = await s.ctx.db.transcripts.get(`transcript_${video.id}`);
    if (existing) {
      await s.log("info", "transcript already present, skipping");
      return;
    }
    const src = await s.ctx.storage.localPath(video.storageKey);
    const result = await s.ctx.transcription.transcribe({
      videoId: video.id,
      mediaPath: src,
      storage: s.ctx.storage,
    });
    const transcript: Transcript = {
      id: `transcript_${video.id}`,
      videoId: video.id,
      language: result.language,
      words: result.words,
      text: wordsToText(result.words),
      provider: s.ctx.transcription.name,
      createdAt: nowIso(),
    };
    await s.ctx.db.transcripts.create(transcript);
    await s.log("info", `transcribed ${result.words.length} words via ${s.ctx.transcription.name}`);
  },
};

/** Derive speakers from the transcript (diarization labels or a single speaker). */
export const speakerStage: Stage = {
  name: "speaker_detection",
  async run(s) {
    const transcript = await s.ctx.db.transcripts.get(`transcript_${s.videoId}`);
    if (!transcript) throw new Error("transcript missing for speaker detection");
    const totals = new Map<string, number>();
    for (const w of transcript.words) {
      const label = w.speaker ?? "Speaker 1";
      totals.set(label, (totals.get(label) ?? 0) + (w.end - w.start));
    }
    const speakers: Speaker[] = [...totals.entries()].map(([label, sec], i) => ({
      id: `spk_${i + 1}`,
      label,
      totalSpeakingSec: Math.round(sec * 10) / 10,
    }));
    await saveAnalysis(s, { speakers });
    await s.log("info", `detected ${speakers.length} speaker(s)`);
  },
};

/** Detect scene-change boundaries with FFmpeg. */
export const sceneStage: Stage = {
  name: "scene_detection",
  async run(s) {
    const video = await requireVideo(s);
    if (!video.width) {
      await saveAnalysis(s, { scenes: [] });
      await s.log("warn", "no video stream; skipping scene detection");
      return;
    }
    const src = await s.ctx.storage.localPath(video.storageKey);
    const scenes = await detectScenes(src, video.durationSec ?? 0);
    await saveAnalysis(s, { scenes });
    await s.log("info", `detected ${scenes.length} scene(s)`);
  },
};

/** Loudness + silence analysis with FFmpeg. */
export const audioStage: Stage = {
  name: "audio_analysis",
  async run(s) {
    const video = await requireVideo(s);
    if (!video.hasAudio) {
      await saveAnalysis(s, {
        audio: { meanVolumeDb: -70, maxVolumeDb: -70, windows: [], silences: [] },
      });
      await s.log("warn", "no audio track; skipping audio analysis");
      return;
    }
    const src = await s.ctx.storage.localPath(video.storageKey);
    const audio = await analyzeAudio(src, video.durationSec ?? 0);
    await saveAnalysis(s, { audio });
    await s.log(
      "info",
      `audio: mean ${audio.meanVolumeDb.toFixed(1)}dB, ${audio.silences.length} silence(s)`,
    );
  },
};

/** Motion/visual-interest analysis with FFmpeg. */
export const visualStage: Stage = {
  name: "visual_analysis",
  async run(s) {
    const video = await requireVideo(s);
    if (!video.width) {
      await saveAnalysis(s, { visual: { windows: [] } });
      await s.log("warn", "no video stream; skipping visual analysis");
      return;
    }
    const src = await s.ctx.storage.localPath(video.storageKey);
    const visual = await analyzeVisual(src, video.durationSec ?? 0);
    await saveAnalysis(s, { visual });
    await s.log("info", `visual: ${visual.windows.length} window(s)`);
  },
};

/** Classify the content type from the transcript to tune ranking priorities. */
export const semanticStage: Stage = {
  name: "semantic_understanding",
  async run(s) {
    const transcript = await s.ctx.db.transcripts.get(`transcript_${s.videoId}`);
    if (!transcript) throw new Error("transcript missing for semantic understanding");
    const { contentType, confidence } = detectContentType(transcript.text);
    await saveAnalysis(s, { contentType, contentTypeConfidence: confidence });
    await s.log("info", `content type: ${contentType} (${(confidence * 100).toFixed(0)}%)`);
  },
};
