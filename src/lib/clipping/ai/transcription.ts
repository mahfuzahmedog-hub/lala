import { promises as fs } from "node:fs";
import type { TranscriptWord } from "../types";
import type { StorageProvider } from "../storage/storageProvider";

export interface TranscribeInput {
  videoId: string;
  /** Local path to the media file (audio can be extracted from it). */
  mediaPath: string;
  storage: StorageProvider;
}

export interface TranscribeResult {
  language: string;
  words: TranscriptWord[];
}

/**
 * Transcription is the one stage that fundamentally needs a speech-to-text
 * model. We keep it behind a provider interface so the model is replaceable
 * (build rule #2) and so the rest of the pipeline is testable offline.
 */
export interface TranscriptionProvider {
  readonly name: string;
  transcribe(input: TranscribeInput): Promise<TranscribeResult>;
}

/** Storage key where an imported/sidecar transcript for a video is expected. */
export function importedTranscriptKey(videoId: string): string {
  return `imports/${videoId}/transcript.json`;
}

/**
 * Uses a caller-provided transcript instead of running ASR. This is how the
 * pipeline runs end-to-end offline: the upload flow (or the demo) writes a
 * word-level transcript to storage, and this provider loads it. It represents
 * the real, common case of "bring your own captions / existing transcript".
 */
export class SidecarTranscriptionProvider implements TranscriptionProvider {
  readonly name = "sidecar-import";

  async transcribe(input: TranscribeInput): Promise<TranscribeResult> {
    const key = importedTranscriptKey(input.videoId);
    if (!(await input.storage.exists(key))) {
      throw new Error(
        "No transcript available. Configure a speech-to-text provider " +
          "(e.g. set OPENAI_API_KEY to use Whisper) or import a word-level " +
          "transcript alongside the video.",
      );
    }
    const buf = await input.storage.read(key);
    const parsed = JSON.parse(buf.toString("utf8")) as Partial<TranscribeResult>;
    if (!parsed.words || parsed.words.length === 0) {
      throw new Error("Imported transcript contained no words.");
    }
    return { language: parsed.language ?? "en", words: parsed.words };
  }
}

/**
 * Real speech-to-text via OpenAI Whisper with word-level timestamps. Active
 * only when an API key is configured. Included to demonstrate that the
 * transcription provider is genuinely swappable.
 */
export class WhisperTranscriptionProvider implements TranscriptionProvider {
  readonly name = "openai-whisper";
  constructor(private readonly apiKey: string) {}

  async transcribe(input: TranscribeInput): Promise<TranscribeResult> {
    const audio = await fs.readFile(input.mediaPath);
    const form = new FormData();
    form.append("file", new Blob([audio]), "audio.mp4");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Whisper transcription failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      language?: string;
      words?: { word: string; start: number; end: number }[];
    };
    const words: TranscriptWord[] = (json.words ?? []).map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));
    return { language: json.language ?? "en", words };
  }
}
