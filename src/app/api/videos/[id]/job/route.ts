import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { latestJobForVideo } from "@/lib/clipping/service";

/** Latest job snapshot for a video (polled by the Processing view). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getContext();
  const job = await latestJobForVideo(ctx, id);
  return NextResponse.json({ job });
}
