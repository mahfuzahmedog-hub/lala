import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { latestJobForVideo } from "@/lib/clipping/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getContext();
  const video = await ctx.db.videos.get(id);
  if (!video) return NextResponse.json({ error: "not found" }, { status: 404 });
  const analysis = await ctx.db.videoAnalyses.get(`analysis_${id}`);
  const transcript = await ctx.db.transcripts.get(`transcript_${id}`);
  const job = await latestJobForVideo(ctx, id);
  return NextResponse.json({
    video,
    analysis,
    hasTranscript: Boolean(transcript),
    transcriptWordCount: transcript?.words.length ?? 0,
    job,
  });
}
