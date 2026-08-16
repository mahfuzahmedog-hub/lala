"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFetch } from "@/lib/useFetch";
import { Badge, Card, EmptyState, PageHeader, Skeleton, statusColor } from "@/components/ui";
import { formatDuration } from "@/lib/utils";
import type { ClipCandidate, Video } from "@/lib/clipping/types";

const SIGNAL_LABELS: Record<string, string> = {
  hookStrength: "Hook",
  emotionalIntensity: "Emotion",
  curiosity: "Curiosity",
  payoff: "Payoff",
  contextIndependence: "Standalone",
  storyQuality: "Story",
  rewatchPotential: "Rewatch",
};

function TopSignals({ candidate }: { candidate: ClipCandidate }) {
  const entries = Object.entries(candidate.signals)
    .filter(([k]) => SIGNAL_LABELS[k])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span key={key} className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/60">
          {SIGNAL_LABELS[key]} {Math.round(value * 100)}
        </span>
      ))}
    </div>
  );
}

function CandidatesInner() {
  const videoId = useSearchParams().get("videoId");
  const videos = useFetch<{ videos: Video[] }>("/api/videos");
  const cands = useFetch<{ candidates: ClipCandidate[] }>(
    videoId ? `/api/videos/${videoId}/candidates` : null,
  );

  if (!videoId) {
    return (
      <div>
        <PageHeader title="Candidates" subtitle="The clip moments the AI discovered and ranked." />
        {videos.data && videos.data.videos.length > 0 ? (
          <div className="space-y-2">
            {videos.data.videos.map((v) => (
              <Link key={v.id} href={`/candidates?videoId=${v.id}`}>
                <Card className="flex items-center justify-between hover:border-white/20">
                  <span>{v.filename}</span>
                  <Badge color={statusColor(v.status)}>{v.status}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No videos yet" hint="Add and process a video to see candidates." />
        )}
      </div>
    );
  }

  const list = cands.data?.candidates ?? [];
  const selected = list.filter((c) => c.selected).length;

  return (
    <div>
      <PageHeader
        title="Candidates"
        subtitle={`Over-generated then ranked. ${list.length} discovered, ${selected} selected.`}
      />
      {cands.loading && !cands.data ? (
        <Skeleton className="h-64" />
      ) : list.length === 0 ? (
        <EmptyState title="No candidates yet" hint="Process this video to discover candidates." />
      ) : (
        <div className="space-y-2">
          {list.map((c, i) => (
            <Card
              key={c.id}
              className={c.selected ? "border-emerald-500/30 bg-emerald-500/[0.04]" : ""}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/40">#{i + 1}</span>
                    <span className="font-medium">score {c.score}</span>
                    <span className="text-xs text-white/40">
                      {formatDuration(c.start)}–{formatDuration(c.end)} (
                      {(c.end - c.start).toFixed(0)}s)
                    </span>
                    {c.selected && <Badge color="green">selected</Badge>}
                    {c.duplicateOf && <Badge color="yellow">duplicate</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-white/70">{c.text}</p>
                  <TopSignals candidate={c} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <CandidatesInner />
    </Suspense>
  );
}
