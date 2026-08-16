"use client";

import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import { Badge, Card, EmptyState, Skeleton, statusColor } from "@/components/ui";
import { formatDuration } from "@/lib/utils";
import type { Clip } from "@/lib/clipping/types";

function ClipCard({ clip }: { clip: Clip }) {
  const version = clip.versions[clip.versions.length - 1];
  return (
    <Card className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg bg-black">
        {version?.storageKey ? (
          <video
            src={mediaUrl(version.storageKey)}
            controls
            preload="metadata"
            className="aspect-[9/16] max-h-72 w-full bg-black object-contain"
          />
        ) : (
          <div className="flex aspect-[9/16] max-h-72 w-full items-center justify-center text-sm text-white/40">
            Not rendered yet
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Badge color={statusColor(clip.status)}>{clip.status}</Badge>
        <span className="text-sm text-white/50">
          {formatDuration(clip.end - clip.start)} · score {clip.score}
        </span>
      </div>
      <p className="line-clamp-2 min-h-[2.5rem] text-sm text-white/80">
        {clip.hook || clip.title}
      </p>
      <div className="flex gap-2">
        <Link href={`/clips/${clip.id}`} className="flex-1">
          <div className="rounded-lg border border-white/10 py-1.5 text-center text-sm hover:bg-white/5">
            Open in editor
          </div>
        </Link>
        {version?.storageKey && (
          <a href={mediaUrl(version.storageKey)} download className="flex-1">
            <div className="rounded-lg border border-white/10 py-1.5 text-center text-sm hover:bg-white/5">
              Download
            </div>
          </a>
        )}
      </div>
    </Card>
  );
}

export function ClipGrid({ clips, loading }: { clips: Clip[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-96" />
        ))}
      </div>
    );
  }
  if (clips.length === 0) {
    return (
      <EmptyState
        title="No clips yet"
        hint="Process a video to generate AI-selected, edited, captioned clips."
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clips.map((c) => (
        <ClipCard key={c.id} clip={c} />
      ))}
    </div>
  );
}
