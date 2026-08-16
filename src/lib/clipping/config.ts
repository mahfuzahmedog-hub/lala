import path from "node:path";
import type { AspectRatio, CaptionPreset, Template, UserSettings } from "./types";

/** Root directory for all persisted data (DB + object storage). */
export function dataDir(): string {
  return process.env.CLIPPING_DATA_DIR
    ? path.resolve(process.env.CLIPPING_DATA_DIR)
    : path.resolve(process.cwd(), ".data");
}

export const DEFAULT_CAPTION_PRESETS: CaptionPreset[] = [
  {
    id: "bold-yellow",
    name: "Bold Yellow",
    fontName: "Arial",
    fontSize: 84,
    primaryColor: "#FFFFFF",
    highlightColor: "#FFE23A",
    position: "bottom",
    uppercase: true,
    animate: true,
  },
  {
    id: "clean-white",
    name: "Clean White",
    fontName: "Arial",
    fontSize: 72,
    primaryColor: "#E6E6E6",
    highlightColor: "#FFFFFF",
    position: "bottom",
    uppercase: false,
    animate: true,
  },
  {
    id: "center-pop",
    name: "Center Pop",
    fontName: "Arial",
    fontSize: 96,
    primaryColor: "#FFFFFF",
    highlightColor: "#37E1B4",
    position: "center",
    uppercase: true,
    animate: true,
  },
];

export const DEFAULT_TEMPLATES: Template[] = [
  { id: "vertical-bold", name: "Vertical / Bold Yellow", aspectRatio: "9:16", captionPresetId: "bold-yellow" },
  { id: "square-clean", name: "Square / Clean White", aspectRatio: "1:1", captionPresetId: "clean-white" },
  { id: "wide-center", name: "Wide / Center Pop", aspectRatio: "16:9", captionPresetId: "center-pop" },
];

export const DEFAULT_ASPECT_RATIOS: AspectRatio[] = ["9:16"];

export function defaultSettings(id: string, userId: string): UserSettings {
  return {
    id,
    userId,
    transcriptionProvider: process.env.OPENAI_API_KEY ? "openai-whisper" : "sidecar-import",
    embeddingProvider: process.env.OPENAI_API_KEY ? "openai" : "hashing-local",
    llmProvider: "heuristic",
    defaultAspectRatios: DEFAULT_ASPECT_RATIOS,
    defaultCaptionPresetId: "bold-yellow",
    qualityAcceptThreshold: 85,
    qualityRejectThreshold: 70,
    maxReeditRetries: 2,
    targetClipCount: 5,
    minClipSec: 12,
    maxClipSec: 60,
  };
}

export const DEMO_USER_ID = "user_demo";
