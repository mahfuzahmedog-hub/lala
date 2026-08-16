import type { ClippingContext } from "../context";
import { newId, nowIso } from "../ids";
import { STAGE_ORDER, type ProcessingJob, type StageName } from "../types";
import { settingsForVideo } from "./settings";
import { probeStage, transcriptionStage, speakerStage, sceneStage, audioStage, visualStage, semanticStage } from "./analysisStages";
import { discoveryStage, rankingStage, duplicateStage, diversityStage } from "./intelligenceStages";
import { boundaryStage, hookStage, reframeStage, captionStage, renderStage } from "./editingStages";
import { qualityStage, finalizeStage } from "./qualityStages";
import type { Stage, StageServices } from "./types";

/** The full ordered stage registry. Order matches {@link STAGE_ORDER}. */
export const STAGES: Stage[] = [
  probeStage,
  transcriptionStage,
  speakerStage,
  sceneStage,
  audioStage,
  visualStage,
  semanticStage,
  discoveryStage,
  rankingStage,
  duplicateStage,
  diversityStage,
  boundaryStage,
  hookStage,
  reframeStage,
  captionStage,
  renderStage,
  qualityStage,
  finalizeStage,
];

/** Create a queued processing job for a video. */
export async function createJob(
  ctx: ClippingContext,
  videoId: string,
  projectId: string,
): Promise<ProcessingJob> {
  const job: ProcessingJob = {
    id: newId("job"),
    videoId,
    projectId,
    status: "queued",
    currentStage: STAGE_ORDER[0],
    completedStages: [],
    progress: 0,
    retryCount: 0,
    log: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  return ctx.db.jobs.create(job);
}

export interface RunOptions {
  /** Called after each stage transition with the latest job snapshot. */
  onProgress?: (job: ProcessingJob) => void;
}

/**
 * Execute (or resume) a processing job. The orchestrator owns the single
 * in-memory job object, mutating and persisting it at every checkpoint so that:
 *  - progress and the current stage are always durable,
 *  - a completed stage is never re-run (build rule #6),
 *  - a failure preserves the outputs of earlier successful stages (rule #9).
 * Re-invoking with the same job id resumes from the first incomplete stage.
 */
export async function runPipeline(
  ctx: ClippingContext,
  jobId: string,
  opts: RunOptions = {},
): Promise<ProcessingJob> {
  const loaded = await ctx.db.jobs.get(jobId);
  if (!loaded) throw new Error(`Job ${jobId} not found`);
  const job = loaded;
  const settings = await settingsForVideo(ctx, job.videoId);

  if (job.status === "failed") job.retryCount += 1;
  if (job.status === "cancelled") return job;
  job.status = "processing";
  job.error = undefined;
  job.startedAt = job.startedAt ?? nowIso();
  job.updatedAt = nowIso();
  await ctx.db.jobs.upsert(job);
  opts.onProgress?.(job);

  const completed = new Set<StageName>(job.completedStages);

  for (const stage of STAGES) {
    if (completed.has(stage.name)) continue;
    job.currentStage = stage.name;
    job.updatedAt = nowIso();
    await ctx.db.jobs.upsert(job);
    opts.onProgress?.(job);

    const services: StageServices = {
      ctx,
      videoId: job.videoId,
      projectId: job.projectId,
      settings,
      log: async (level, message) => {
        job.log.push({ at: nowIso(), stage: stage.name, level, message });
        job.updatedAt = nowIso();
        await ctx.db.jobs.upsert(job);
        // Mirror to stdout so CLI/worker runs are observable.
        console[level === "error" ? "error" : "log"](`[${stage.name}] ${message}`);
      },
    };

    try {
      await stage.run(services);
      completed.add(stage.name);
      job.completedStages = STAGE_ORDER.filter((n) => completed.has(n));
      job.progress = job.completedStages.length / STAGE_ORDER.length;
      job.updatedAt = nowIso();
      await ctx.db.jobs.upsert(job);
      opts.onProgress?.(job);
    } catch (err) {
      job.status = "failed";
      job.error = (err as Error).message;
      job.log.push({
        at: nowIso(),
        stage: stage.name,
        level: "error",
        message: (err as Error).message,
      });
      job.updatedAt = nowIso();
      await ctx.db.jobs.upsert(job);
      await ctx.db.videos.update(job.videoId, { status: "failed", updatedAt: nowIso() }).catch(() => {});
      opts.onProgress?.(job);
      return job;
    }
  }

  job.status = "completed";
  job.progress = 1;
  job.finishedAt = nowIso();
  job.updatedAt = nowIso();
  await ctx.db.jobs.upsert(job);
  opts.onProgress?.(job);
  return job;
}
