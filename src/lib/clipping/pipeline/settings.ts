import type { ClippingContext } from "../context";
import { DEMO_USER_ID, defaultSettings } from "../config";
import type { UserSettings } from "../types";

/** Look up the settings governing a video (falls back to demo defaults). */
export async function settingsForVideo(
  ctx: ClippingContext,
  videoId: string,
): Promise<UserSettings> {
  const video = await ctx.db.videos.get(videoId);
  const project = video ? await ctx.db.projects.get(video.projectId) : null;
  const userId = project?.userId ?? DEMO_USER_ID;
  const found = await ctx.db.settings.get(`settings_${userId}`);
  return found ?? defaultSettings(`settings_${userId}`, userId);
}
