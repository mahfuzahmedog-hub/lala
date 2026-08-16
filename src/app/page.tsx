"use client";

import Link from "next/link";
import { useFetch } from "@/lib/useFetch";
import { Card, PageHeader, Skeleton, Stat, Badge, statusColor } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import type { Video } from "@/lib/clipping/types";

interface DashboardData {
  projects: number;
  videos: number;
  clips: number;
  acceptedClips: number;
  rejectedClips: number;
  activeJobs: number;
  recentVideos: Video[];
}

export default function DashboardPage() {
  const { data, loading } = useFetch<DashboardData>("/api/dashboard", 5000);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Turn long-form video into high-quality short-form clips."
      />
      {loading && !data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Projects" value={data?.projects ?? 0} />
            <Stat label="Videos" value={data?.videos ?? 0} />
            <Stat label="Accepted clips" value={data?.acceptedClips ?? 0} />
            <Stat label="Active jobs" value={data?.activeJobs ?? 0} />
          </div>

          <h2 className="mb-3 mt-8 text-lg font-medium">Recent videos</h2>
          {data && data.recentVideos.length > 0 ? (
            <div className="space-y-2">
              {data.recentVideos.map((v) => (
                <Link key={v.id} href={`/processing?videoId=${v.id}`}>
                  <Card className="flex items-center justify-between hover:border-white/20">
                    <div>
                      <p className="font-medium">{v.filename}</p>
                      <p className="text-xs text-white/40">{timeAgo(v.createdAt)}</p>
                    </div>
                    <Badge color={statusColor(v.status)}>{v.status}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-white/60">
                No videos yet. Head to{" "}
                <Link href="/projects" className="text-indigo-300 underline">
                  Projects
                </Link>{" "}
                to create one and add a sample video.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
