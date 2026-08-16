import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { createProject, listProjects } from "@/lib/clipping/service";

export async function GET() {
  const ctx = await getContext();
  const projects = await listProjects(ctx);
  // Attach lightweight counts for the dashboard/list views.
  const withCounts = await Promise.all(
    projects.map(async (p) => {
      const videos = await ctx.db.videos.list((v) => v.projectId === p.id);
      const clips = await ctx.db.clips.list((c) => c.projectId === p.id);
      return { ...p, videoCount: videos.length, clipCount: clips.length };
    }),
  );
  return NextResponse.json({ projects: withCounts });
}

export async function POST(req: Request) {
  const ctx = await getContext();
  const body = (await req.json().catch(() => ({}))) as { name?: string; description?: string };
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const project = await createProject(ctx, body.name.trim(), body.description?.trim());
  return NextResponse.json({ project }, { status: 201 });
}
