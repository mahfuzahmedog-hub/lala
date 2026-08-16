"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFetch } from "@/lib/useFetch";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  Skeleton,
  statusColor,
} from "@/components/ui";
import { STAGE_ORDER, type ProcessingJob, type Video } from "@/lib/clipping/types";

const STAGE_LABEL: Record<string, string> = {
  probe: "Media probe",
  transcription: "Transcription",
  speaker_detection: "Speaker detection",
  scene_detection: "Scene detection",
  audio_analysis: "Audio analysis",
  visual_analysis: "Visual analysis",
  semantic_understanding: "Semantic understanding",
  candidate_discovery: "Candidate discovery",
  candidate_ranking: "Candidate ranking",
  duplicate_removal: "Duplicate removal",
  diversity_selection: "Diversity selection",
  boundary_optimization: "Boundary optimization",
  hook_optimization: "Hook optimization",
  auto_reframe: "Auto-reframing",
  captions: "Captions",
  render: "FFmpeg render",
  quality_critic: "AI quality critic",
  finalize: "Finalize",
};

function StageList({ job }: { job: ProcessingJob }) {
  const done = new Set(job.completedStages);
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {STAGE_ORDER.map((stage) => {
        const isDone = done.has(stage);
        const isCurrent = job.currentStage === stage && job.status === "processing";
        return (
          <div
            key={stage}
            className="flex items-center gap-2 rounded-lg border border-white/5 px-3 py-1.5 text-sm"
          >
            <span
              className={
                isDone
                  ? "h-2 w-2 rounded-full bg-emerald-400"
                  : isCurrent
                    ? "h-2 w-2 animate-pulse rounded-full bg-sky-400"
                    : "h-2 w-2 rounded-full bg-white/20"
              }
            />
            <span className={isDone ? "text-white/80" : isCurrent ? "text-sky-300" : "text-white/40"}>
              {STAGE_LABEL[stage] ?? stage}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ProcessingInner() {
  const videoId = useSearchParams().get("videoId");
  const videos = useFetch<{ videos: Video[] }>("/api/videos");
  const jobState = useFetch<{ job: ProcessingJob | null }>(
    videoId ? `/api/videos/${videoId}/job` : null,
    2000,
  );

  if (!videoId) {
    return (
      <div>
        <PageHeader title="Processing" subtitle="Watch the pipeline run, stage by stage." />
        {videos.data && videos.data.videos.length > 0 ? (
          <div className="space-y-2">
            {videos.data.videos.map((v) => (
              <Link key={v.id} href={`/processing?videoId=${v.id}`}>
                <Card className="flex items-center justify-between hover:border-white/20">
                  <span>{v.filename}</span>
                  <Badge color={statusColor(v.status)}>{v.status}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No videos to process" hint="Add a video from a project first." />
        )}
      </div>
    );
  }

  const job = jobState.data?.job ?? null;

  return (
    <div>
      <PageHeader
        title="Processing"
        subtitle="Live pipeline status. Persisted state survives refreshes and restarts."
      />
      {jobState.loading && !jobState.data ? (
        <Skeleton className="h-64" />
      ) : !job ? (
        <EmptyState
          title="No job yet"
          hint="Start processing this video from its project or the Videos page."
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge color={statusColor(job.status)}>{job.status}</Badge>
                {job.retryCount > 0 && <span className="text-xs text-white/40">retry #{job.retryCount}</span>}
              </div>
              <span className="text-sm text-white/50">{Math.round(job.progress * 100)}%</span>
            </div>
            <ProgressBar value={job.progress} />
            {job.error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {job.error}
              </p>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-medium text-white/70">Stages</h3>
            <StageList job={job} />
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-medium text-white/70">Log</h3>
            <div className="max-h-72 space-y-1 overflow-y-auto font-mono text-xs">
              {job.log.length === 0 && <p className="text-white/40">No log entries yet.</p>}
              {job.log
                .slice()
                .reverse()
                .map((entry, i) => (
                  <div key={i} className="flex gap-2">
                    <span
                      className={
                        entry.level === "error"
                          ? "text-red-400"
                          : entry.level === "warn"
                            ? "text-amber-400"
                            : "text-white/40"
                      }
                    >
                      [{entry.stage}]
                    </span>
                    <span className="text-white/70">{entry.message}</span>
                  </div>
                ))}
            </div>
          </Card>

          {job.status === "completed" && (
            <Link href={`/candidates?videoId=${videoId}`} className="text-indigo-300 underline">
              View candidates →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <ProcessingInner />
    </Suspense>
  );
}
