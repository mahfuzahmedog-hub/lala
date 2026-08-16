import type { ClippingContext } from "../context";
import type { StageName, UserSettings, Video, VideoAnalysis } from "../types";
import { nowIso } from "../ids";

export interface StageServices {
  ctx: ClippingContext;
  videoId: string;
  projectId: string;
  settings: UserSettings;
  /** Append an entry to the job log (also mirrored to stdout for scripts). */
  log: (level: "info" | "warn" | "error", message: string) => Promise<void>;
}

export interface Stage {
  name: StageName;
  run(s: StageServices): Promise<void>;
}

/** Load the video row or throw. */
export async function requireVideo(s: StageServices): Promise<Video> {
  const v = await s.ctx.db.videos.get(s.videoId);
  if (!v) throw new Error(`Video ${s.videoId} not found`);
  return v;
}

/** Get (creating if needed) the VideoAnalysis row for the current video. */
export async function getOrCreateAnalysis(s: StageServices): Promise<VideoAnalysis> {
  const id = `analysis_${s.videoId}`;
  const existing = await s.ctx.db.videoAnalyses.get(id);
  if (existing) return existing;
  const created: VideoAnalysis = {
    id,
    videoId: s.videoId,
    contentType: "unknown",
    contentTypeConfidence: 0,
    speakers: [],
    scenes: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  return s.ctx.db.videoAnalyses.create(created);
}

export async function saveAnalysis(
  s: StageServices,
  patch: Partial<VideoAnalysis>,
): Promise<VideoAnalysis> {
  const id = `analysis_${s.videoId}`;
  return s.ctx.db.videoAnalyses.update(id, { ...patch, updatedAt: nowIso() });
}

/** Mean audio intensity across analysis windows overlapping [start, end]. */
export function intensityAccessor(
  windows: { start: number; end: number; intensity: number }[] | undefined,
) {
  return (start: number, end: number): number => {
    if (!windows || windows.length === 0) return 0.5;
    const overlapping = windows.filter((w) => w.end > start && w.start < end);
    if (overlapping.length === 0) return 0.5;
    return overlapping.reduce((a, w) => a + w.intensity, 0) / overlapping.length;
  };
}

/** Mean visual motion across analysis windows overlapping [start, end]. */
export function motionAccessor(
  windows: { start: number; end: number; motion: number }[] | undefined,
) {
  return (start: number, end: number): number => {
    if (!windows || windows.length === 0) return 0.5;
    const overlapping = windows.filter((w) => w.end > start && w.start < end);
    if (overlapping.length === 0) return 0.5;
    return overlapping.reduce((a, w) => a + w.motion, 0) / overlapping.length;
  };
}
