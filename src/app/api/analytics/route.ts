import { NextResponse } from "next/server";
import { getContext } from "@/lib/clipping/context";

/**
 * Analytics overview: every clip that has an analytics row, joined with its
 * title and predicted quality score, plus recorded actuals. This is the seam
 * where real performance data (views, watch-through) would be reconciled
 * against the model's prediction to drive creator-specific learning.
 */
export async function GET() {
  const ctx = await getContext();
  const analytics = await ctx.db.analytics.list();
  const rows = await Promise.all(
    analytics.map(async (a) => {
      const clip = await ctx.db.clips.get(a.clipId);
      return {
        clipId: a.clipId,
        title: clip?.hook || clip?.title || a.clipId,
        predictedScore: a.predictedScore,
        views: a.views,
        likes: a.likes,
        shares: a.shares,
        watchThroughRate: a.watchThroughRate,
      };
    }),
  );
  rows.sort((a, b) => b.predictedScore - a.predictedScore);
  return NextResponse.json({ analytics: rows });
}
