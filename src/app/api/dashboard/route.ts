import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";

/** High-level counts for the dashboard landing view. */
export async function GET() {
  const ctx = await getContext();
  const [projects, videos, clips, jobs] = await Promise.all([
    ctx.db.projects.list(),
    ctx.db.videos.list(),
    ctx.db.clips.list(),
    ctx.db.jobs.list(),
  ]);
  const byStatus = (status: string) => clips.filter((c) => c.status === status).length;
  return NextResponse.json({
    projects: projects.length,
    videos: videos.length,
    clips: clips.length,
    acceptedClips: byStatus("accepted"),
    rejectedClips: byStatus("rejected"),
    activeJobs: jobs.filter((j) => j.status === "processing" || j.status === "queued").length,
    recentVideos: videos
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  });
}
