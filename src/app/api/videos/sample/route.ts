import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { getContext } from "@/lib/clipping/context";
import { createVideo } from "@/lib/clipping/service";
import { makeSampleVideoFile } from "@/lib/clipping/sample";

/**
 * Generate a real sample video (with a matching transcript) and attach it to a
 * project. This lets the app be exercised end-to-end without needing a source
 * file and a speech-to-text key handy.
 */
export async function POST(req: Request) {
  const ctx = await getContext();
  const body = (await req.json().catch(() => ({}))) as { projectId?: string };
  if (!body.projectId || !(await ctx.db.projects.get(body.projectId))) {
    return NextResponse.json({ error: "valid projectId is required" }, { status: 400 });
  }
  const { filePath, transcript, cleanup } = await makeSampleVideoFile();
  try {
    const data = await fs.readFile(filePath);
    const video = await createVideo(ctx, {
      projectId: body.projectId,
      filename: "sample.mp4",
      data,
      transcript: { language: "en", words: transcript.words },
    });
    return NextResponse.json({ video }, { status: 201 });
  } finally {
    await cleanup();
  }
}
