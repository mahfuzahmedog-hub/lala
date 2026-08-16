import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ASPECT_DIMENSIONS, renderClip } from "../media/mediaEngine";
import { buildCaptions, captionsToAss } from "../intelligence/captions";
import { wordsInRange } from "../intelligence/text";
import { nowIso } from "../ids";
import type { CaptionPreset, Clip, ClipVersion } from "../types";
import { requireVideo, type StageServices } from "./types";

/** Resolve the caption preset to use for a clip from user settings. */
export function resolvePreset(s: StageServices, clip: Clip): CaptionPreset {
  const preset =
    s.ctx.captionPresets.find((p) => p.id === s.settings.defaultCaptionPresetId) ??
    s.ctx.captionPresets[0];
  return preset;
}

/**
 * Render the next version of a clip: rebuild captions from the current
 * boundaries, generate the ASS subtitle file, reframe + burn + encode with
 * FFmpeg, persist both artifacts, and append a ClipVersion. Shared by the
 * render stage and the quality re-edit loop so a re-render always reflects the
 * clip's latest boundaries.
 */
export async function renderClipVersion(s: StageServices, clip: Clip): Promise<Clip> {
  const video = await requireVideo(s);
  const transcript = await s.ctx.db.transcripts.get(`transcript_${s.videoId}`);
  const words = transcript ? wordsInRange(transcript.words, clip.start, clip.end) : [];
  const captions = buildCaptions(words);
  const preset = resolvePreset(s, clip);
  const dims = ASPECT_DIMENSIONS[clip.aspectRatio];

  const version = clip.currentVersion + 1;
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `clip-${clip.id}-`));
  const assPath = path.join(workDir, `v${version}.ass`);
  const outPath = path.join(workDir, `v${version}.mp4`);
  try {
    await fs.writeFile(assPath, captionsToAss(captions, preset, dims, clip.start), "utf8");
    const src = await s.ctx.storage.localPath(video.storageKey);
    await renderClip({
      input: src,
      output: outPath,
      start: clip.start,
      end: clip.end,
      aspectRatio: clip.aspectRatio,
      hasAudio: Boolean(video.hasAudio),
      assPath,
      focusX: clip.focusX ?? 0.5,
    });

    const storageKey = `clips/${clip.id}/v${version}.mp4`;
    const captionsKey = `clips/${clip.id}/v${version}.ass`;
    await s.ctx.storage.writeFromFile(storageKey, outPath);
    await s.ctx.storage.writeFromFile(captionsKey, assPath);

    const clipVersion: ClipVersion = {
      version,
      storageKey,
      captionsKey,
      aspectRatio: clip.aspectRatio,
      start: clip.start,
      end: clip.end,
      createdAt: nowIso(),
    };
    return s.ctx.db.clips.update(clip.id, {
      captions,
      versions: [...clip.versions, clipVersion],
      currentVersion: version,
      status: "rendered",
      updatedAt: nowIso(),
    });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
