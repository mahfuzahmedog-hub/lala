import type { ClippingContext } from "./context";
import { importedTranscriptKey } from "./ai/transcription";
import { newId, nowIso } from "./ids";
import { createJob, runPipeline } from "./pipeline/orchestrator";
import { renderClipVersion } from "./pipeline/render";
import { settingsForVideo } from "./pipeline/settings";
import type { StageServices } from "./pipeline/types";
import type {
  AspectRatio,
  Clip,
  ClipCandidate,
  Project,
  ProcessingJob,
  TranscriptWord,
  Video,
} from "./types";
import { DEMO_USER_ID } from "./config";

export async function listProjects(ctx: ClippingContext): Promise<Project[]> {
  const projects = await ctx.db.projects.list();
  return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createProject(
  ctx: ClippingContext,
  name: string,
  description?: string,
): Promise<Project> {
  const project: Project = {
    id: newId("proj"),
    userId: DEMO_USER_ID,
    name,
    description,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  return ctx.db.projects.create(project);
}

export interface CreateVideoInput {
  projectId: string;
  filename: string;
  data: Buffer;
  /** Optional word-level transcript to import (used when no ASR is configured). */
  transcript?: { language?: string; words: TranscriptWord[] };
}

/**
 * Persist an uploaded video into object storage (and its optional sidecar
 * transcript), then create the Video row. The heavy processing is a separate,
 * explicit step so uploads stay fast.
 */
export async function createVideo(ctx: ClippingContext, input: CreateVideoInput): Promise<Video> {
  const id = newId("vid");
  const storageKey = `videos/${id}/original-${input.filename}`;
  await ctx.storage.write(storageKey, input.data);
  if (input.transcript) {
    await ctx.storage.write(
      importedTranscriptKey(id),
      Buffer.from(JSON.stringify(input.transcript), "utf8"),
    );
  }
  const video: Video = {
    id,
    projectId: input.projectId,
    filename: input.filename,
    storageKey,
    sizeBytes: input.data.byteLength,
    status: "uploaded",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  return ctx.db.videos.create(video);
}

/**
 * Begin processing a video. Returns the created job immediately; when
 * `background` is true the pipeline runs detached (used by the HTTP API), and
 * when false the caller awaits full completion (used by the demo/tests).
 */
export async function startProcessing(
  ctx: ClippingContext,
  videoId: string,
  opts: { background?: boolean } = {},
): Promise<ProcessingJob> {
  const video = await ctx.db.videos.get(videoId);
  if (!video) throw new Error(`Video ${videoId} not found`);
  const job = await createJob(ctx, videoId, video.projectId);
  const runner = runPipeline(ctx, job.id).catch((err) => {
    console.error(`pipeline crashed for job ${job.id}:`, err);
  });
  if (!opts.background) await runner;
  return job;
}

export async function latestJobForVideo(
  ctx: ClippingContext,
  videoId: string,
): Promise<ProcessingJob | null> {
  const jobs = await ctx.db.jobs.list((j) => j.videoId === videoId);
  if (jobs.length === 0) return null;
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function candidatesForVideo(
  ctx: ClippingContext,
  videoId: string,
): Promise<ClipCandidate[]> {
  const cands = await ctx.db.candidates.list((c) => c.videoId === videoId);
  return cands.sort((a, b) => b.score - a.score);
}

export async function clipsForProject(ctx: ClippingContext, projectId: string): Promise<Clip[]> {
  const clips = await ctx.db.clips.list((c) => c.projectId === projectId);
  return clips.sort((a, b) => b.score - a.score);
}

export interface ClipEdit {
  start?: number;
  end?: number;
  aspectRatio?: AspectRatio;
  focusX?: number;
  captionPresetId?: string;
}

/**
 * Apply a manual edit from the browser editor and re-render a fresh version of
 * the clip. Reuses the same render path as the pipeline so captions, reframing,
 * and encoding stay consistent.
 */
export async function editAndRerenderClip(
  ctx: ClippingContext,
  clipId: string,
  edit: ClipEdit,
): Promise<Clip> {
  const clip = await ctx.db.clips.get(clipId);
  if (!clip) throw new Error(`Clip ${clipId} not found`);

  const patch: Partial<Clip> = { updatedAt: nowIso() };
  if (typeof edit.start === "number") patch.start = Math.max(0, edit.start);
  if (typeof edit.end === "number") patch.end = edit.end;
  if (edit.aspectRatio) patch.aspectRatio = edit.aspectRatio;
  if (typeof edit.focusX === "number") patch.focusX = Math.max(0, Math.min(1, edit.focusX));
  const updated = await ctx.db.clips.update(clipId, patch);

  const baseSettings = await settingsForVideo(ctx, updated.videoId);
  const settings = edit.captionPresetId
    ? { ...baseSettings, defaultCaptionPresetId: edit.captionPresetId }
    : baseSettings;

  const services: StageServices = {
    ctx,
    videoId: updated.videoId,
    projectId: updated.projectId,
    settings,
    log: async () => {},
  };
  return renderClipVersion(services, updated);
}

