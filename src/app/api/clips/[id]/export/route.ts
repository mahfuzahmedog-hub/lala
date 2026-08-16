import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { nowIso } from "@/lib/clipping/ids";

/** Mark a clip as exported (its rendered file is downloadable via /api/media). */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getContext();
  const clip = await ctx.db.clips.get(id);
  if (!clip) return NextResponse.json({ error: "not found" }, { status: 404 });
  const version = clip.versions[clip.versions.length - 1];
  if (!version?.storageKey) {
    return NextResponse.json({ error: "clip has not been rendered yet" }, { status: 409 });
  }
  const updated = await ctx.db.clips.update(id, { status: "exported", updatedAt: nowIso() });
  return NextResponse.json({
    clip: updated,
    downloadUrl: ctx.storage.publicPath(version.storageKey),
  });
}
