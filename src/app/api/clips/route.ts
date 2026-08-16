import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { clipsForProject } from "@/lib/clipping/service";

export async function GET(req: Request) {
  const ctx = await getContext();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status");
  let clips = projectId
    ? await clipsForProject(ctx, projectId)
    : (await ctx.db.clips.list()).sort((a, b) => b.score - a.score);
  if (status) clips = clips.filter((c) => c.status === status);
  return NextResponse.json({ clips });
}
