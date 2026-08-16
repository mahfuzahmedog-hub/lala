"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  statusColor,
} from "@/components/ui";
import { formatBytes, timeAgo } from "@/lib/utils";
import type { Video } from "@/lib/clipping/types";

export default function VideosPage() {
  const { data, loading, reload } = useFetch<{ videos: Video[] }>("/api/videos", 4000);
  const [busy, setBusy] = useState<string | null>(null);

  const process = async (id: string) => {
    setBusy(id);
    try {
      await api.post(`/api/videos/${id}/process`);
    } finally {
      setBusy(null);
      reload();
    }
  };

  return (
    <div>
      <PageHeader title="Videos" subtitle="Every source video across your projects." />
      {loading && !data ? (
        <Skeleton className="h-40" />
      ) : data && data.videos.length > 0 ? (
        <div className="space-y-2">
          {data.videos.map((v) => (
            <Card key={v.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{v.filename}</p>
                <p className="text-xs text-white/40">
                  {formatBytes(v.sizeBytes)}
                  {v.durationSec ? ` · ${v.durationSec.toFixed(0)}s` : ""}
                  {v.width ? ` · ${v.width}×${v.height}` : ""} · {timeAgo(v.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={statusColor(v.status)}>{v.status}</Badge>
                <Link href={`/candidates?videoId=${v.id}`}>
                  <Button variant="ghost" size="sm">
                    Candidates
                  </Button>
                </Link>
                <Link href={`/processing?videoId=${v.id}`}>
                  <Button variant="ghost" size="sm">
                    Processing
                  </Button>
                </Link>
                <Button size="sm" onClick={() => process(v.id)} loading={busy === v.id}>
                  {v.status === "ready" ? "Reprocess" : "Process"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No videos yet"
          hint="Create a project and add a sample video to get started."
          action={
            <Link href="/projects">
              <Button>Go to Projects</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
