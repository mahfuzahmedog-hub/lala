import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";
import { DEMO_USER_ID } from "@/lib/clipping/config";
import type { UserSettings } from "@/lib/clipping/types";

const SETTINGS_ID = `settings_${DEMO_USER_ID}`;

export async function GET() {
  const ctx = await getContext();
  const settings = await ctx.db.settings.get(SETTINGS_ID);
  const templates = await ctx.db.templates.list();
  return NextResponse.json({ settings, captionPresets: ctx.captionPresets, templates });
}

const EDITABLE: (keyof UserSettings)[] = [
  "transcriptionProvider",
  "embeddingProvider",
  "llmProvider",
  "defaultAspectRatios",
  "defaultCaptionPresetId",
  "qualityAcceptThreshold",
  "qualityRejectThreshold",
  "maxReeditRetries",
  "targetClipCount",
  "minClipSec",
  "maxClipSec",
];

export async function PUT(req: Request) {
  const ctx = await getContext();
  const body = (await req.json().catch(() => ({}))) as Partial<UserSettings>;
  const patch: Partial<UserSettings> = {};
  for (const key of EDITABLE) {
    if (body[key] !== undefined) {
      (patch as Record<string, unknown>)[key] = body[key];
    }
  }
  const settings = await ctx.db.settings.update(SETTINGS_ID, patch);
  return NextResponse.json({ settings });
}
