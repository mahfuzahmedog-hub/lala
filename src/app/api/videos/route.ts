import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { createVideo } from "@/lib/clipping/service";
import type { TranscriptWord } from "@/lib/clipping/types";

export async function GET(req: Request) {
  const ctx = await getContext();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const videos = await ctx.db.videos.list((v) => (projectId ? v.projectId === projectId : true));
  videos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ videos });
}

/**
 * Upload a video via multipart form data. Fields:
 *  - projectId (required)
 *  - file (required): the video file
 *  - transcript (optional): a JSON file with { language?, words: [...] }
 */
export async function POST(req: Request) {
  const ctx = await getContext();
  const form = await req.formData();
  const projectId = form.get("projectId");
  const file = form.get("file");
  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!(await ctx.db.projects.get(projectId))) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  let transcript: { language?: string; words: TranscriptWord[] } | undefined;
  const transcriptField = form.get("transcript");
  if (transcriptField instanceof File) {
    try {
      const parsed = JSON.parse(await transcriptField.text());
      if (Array.isArray(parsed?.words)) transcript = parsed;
    } catch {
      return NextResponse.json({ error: "transcript must be valid JSON" }, { status: 400 });
    }
  }

  const data = Buffer.from(await file.arrayBuffer());
  const video = await createVideo(ctx, {
    projectId,
    filename: file.name || "upload.mp4",
    data,
    transcript,
  });
  return NextResponse.json({ video }, { status: 201 });
}
