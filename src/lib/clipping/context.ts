import path from "node:path";
import { JsonDatabase } from "./db/jsonDatabase";
import type { Database } from "./db/types";
import { LocalStorageProvider, type StorageProvider } from "./storage/storageProvider";
import {
  HashingEmbeddingProvider,
  OpenAIEmbeddingProvider,
  type EmbeddingProvider,
} from "./ai/embedding";
import {
  SidecarTranscriptionProvider,
  WhisperTranscriptionProvider,
  type TranscriptionProvider,
} from "./ai/transcription";
import {
  DEFAULT_CAPTION_PRESETS,
  DEFAULT_TEMPLATES,
  DEMO_USER_ID,
  dataDir,
  defaultSettings,
} from "./config";
import { nowIso } from "./ids";
import type { CaptionPreset } from "./types";

/** Everything a pipeline stage or API route needs to do its work. */
export interface ClippingContext {
  db: Database;
  storage: StorageProvider;
  embedding: EmbeddingProvider;
  transcription: TranscriptionProvider;
  captionPresets: CaptionPreset[];
}

/** Build a context rooted at `root` (DB under db/, media under storage/). */
export function createContext(root: string = dataDir()): ClippingContext {
  const db = new JsonDatabase(path.join(root, "db"));
  const storage = new LocalStorageProvider(path.join(root, "storage"));
  const openAiKey = process.env.OPENAI_API_KEY;
  const embedding: EmbeddingProvider = openAiKey
    ? new OpenAIEmbeddingProvider(openAiKey)
    : new HashingEmbeddingProvider();
  const transcription: TranscriptionProvider = openAiKey
    ? new WhisperTranscriptionProvider(openAiKey)
    : new SidecarTranscriptionProvider();
  return { db, storage, embedding, transcription, captionPresets: DEFAULT_CAPTION_PRESETS };
}

/**
 * Ensure the baseline records exist: a demo user, the default caption presets,
 * templates, and a settings row. Idempotent — safe to call on every boot.
 */
export async function ensureSeed(ctx: ClippingContext): Promise<void> {
  const existingUser = await ctx.db.users.get(DEMO_USER_ID);
  if (!existingUser) {
    await ctx.db.users.create({
      id: DEMO_USER_ID,
      email: "demo@clipping.local",
      name: "Demo Creator",
      createdAt: nowIso(),
    });
  }
  for (const t of DEFAULT_TEMPLATES) {
    if (!(await ctx.db.templates.get(t.id))) await ctx.db.templates.create(t);
  }
  const settingsId = `settings_${DEMO_USER_ID}`;
  if (!(await ctx.db.settings.get(settingsId))) {
    await ctx.db.settings.create(defaultSettings(settingsId, DEMO_USER_ID));
  }
}

let singleton: ClippingContext | null = null;
let seeded: Promise<void> | null = null;

/** Process-wide context used by the Next.js API routes. */
export async function getContext(): Promise<ClippingContext> {
  if (!singleton) singleton = createContext();
  if (!seeded) seeded = ensureSeed(singleton);
  await seeded;
  return singleton;
}
