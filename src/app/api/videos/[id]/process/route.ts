import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { startProcessing } from "@/lib/clipping/service";

/** Kick off processing for a video. The pipeline runs in the background. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getContext();
  const video = await ctx.db.videos.get(id);
  if (!video) return NextResponse.json({ error: "not found" }, { status: 404 });
  const job = await startProcessing(ctx, id, { background: true });
  return NextResponse.json({ job }, { status: 202 });
}
