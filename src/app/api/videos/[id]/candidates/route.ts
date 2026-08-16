import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { candidatesForVideo } from "@/lib/clipping/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getContext();
  const candidates = await candidatesForVideo(ctx, id);
  return NextResponse.json({ candidates });
}
