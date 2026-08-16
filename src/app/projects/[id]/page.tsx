"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
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
import { ClipGrid } from "@/components/ClipGrid";
import type { Clip, Project, Video } from "@/lib/clipping/types";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projects = useFetch<{ projects: (Project & { videoCount: number })[] }>("/api/projects");
  const videos = useFetch<{ videos: Video[] }>(`/api/videos?projectId=${id}`, 4000);
  const clips = useFetch<{ clips: Clip[] }>(`/api/clips?projectId=${id}`, 4000);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const project = projects.data?.projects.find((p) => p.id === id);

  const withBusy = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      videos.reload();
      clips.reload();
    }
  };

  const addSample = () =>
    withBusy("sample", async () => {
      await api.post("/api/videos/sample", { projectId: id });
    });

  const uploadFile = (file: File) =>
    withBusy("upload", async () => {
      const form = new FormData();
      form.append("projectId", id);
      form.append("file", file);
      await api.upload("/api/videos", form);
    });

  const process = (videoId: string) =>
    withBusy(videoId, async () => {
      await api.post(`/api/videos/${videoId}/process`);
    });

  return (
    <div>
      <PageHeader
        title={project?.name ?? "Project"}
        subtitle="Add a video, then run the clipping pipeline."
        actions={
          <>
            <Button variant="secondary" onClick={() => fileInput.current?.click()} loading={busy === "upload"}>
              Upload video
            </Button>
            <Button onClick={addSample} loading={busy === "sample"}>
              Add sample video
            </Button>
          </>
        }
      />
      <input
        ref={fileInput}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <h2 className="mb-3 text-lg font-medium">Videos</h2>
      {videos.loading && !videos.data ? (
        <Skeleton className="h-24" />
      ) : videos.data && videos.data.videos.length > 0 ? (
        <div className="mb-8 space-y-2">
          {videos.data.videos.map((v) => (
            <Card key={v.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{v.filename}</p>
                <p className="text-xs text-white/40">
                  {formatBytes(v.sizeBytes)}
                  {v.durationSec ? ` · ${v.durationSec.toFixed(0)}s` : ""} · {timeAgo(v.createdAt)}
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
          title="No videos in this project"
          hint="Add a generated sample (no upload needed) or upload your own video file."
          action={
            <Button onClick={addSample} loading={busy === "sample"}>
              Add sample video
            </Button>
          }
        />
      )}

      <h2 className="mb-3 text-lg font-medium">Clips</h2>
      <ClipGrid clips={clips.data?.clips ?? []} loading={clips.loading && !clips.data} />
    </div>
  );
}
