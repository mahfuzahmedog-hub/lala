import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { editAndRerenderClip, type ClipEdit } from "@/lib/clipping/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getContext();
  const clip = await ctx.db.clips.get(id);
  if (!clip) return NextResponse.json({ error: "not found" }, { status: 404 });
  const video = await ctx.db.videos.get(clip.videoId);
  const reviews = (await ctx.db.qualityReviews.list((r) => r.clipId === id)).sort(
    (a, b) => b.version - a.version,
  );
  const analytics = await ctx.db.analytics.get(`analytics_${id}`);
  return NextResponse.json({ clip, video, reviews, analytics });
}

/** Apply a manual edit and re-render (browser editor). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getContext();
  const clip = await ctx.db.clips.get(id);
  if (!clip) return NextResponse.json({ error: "not found" }, { status: 404 });
  const edit = (await req.json().catch(() => ({}))) as ClipEdit;
  if (typeof edit.start === "number" && typeof edit.end === "number" && edit.end <= edit.start) {
    return NextResponse.json({ error: "end must be after start" }, { status: 400 });
  }
  const updated = await editAndRerenderClip(ctx, id, edit);
  return NextResponse.json({ clip: updated });
}
