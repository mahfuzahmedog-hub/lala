import { spawn } from "node:child_process";
import type {
  AspectRatio,
  AudioAnalysis,
  Scene,
  VisualAnalysis,
} from "../types";

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Spawn a binary, capture stdout/stderr, and resolve when it exits. */
function run(bin: string, args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

export interface ProbeResult {
  durationSec: number;
  width?: number;
  height?: number;
  fps?: number;
  videoCodec?: string;
  audioCodec?: string;
  hasAudio: boolean;
}

function parseFps(rate?: string): number | undefined {
  if (!rate) return undefined;
  const [num, den] = rate.split("/").map(Number);
  if (!den) return num || undefined;
  return num / den;
}

/** Read container/stream metadata with ffprobe. */
export async function probe(path: string): Promise<ProbeResult> {
  const { code, stdout, stderr } = await run(FFPROBE, [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    path,
  ]);
  if (code !== 0) throw new Error(`ffprobe failed: ${stderr}`);
  const json = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: {
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
      r_frame_rate?: string;
    }[];
  };
  const streams = json.streams ?? [];
  const video = streams.find((s) => s.codec_type === "video");
  const audio = streams.find((s) => s.codec_type === "audio");
  return {
    durationSec: Number(json.format?.duration ?? 0),
    width: video?.width,
    height: video?.height,
    fps: parseFps(video?.r_frame_rate),
    videoCodec: video?.codec_name,
    audioCodec: audio?.codec_name,
    hasAudio: Boolean(audio),
  };
}

/** Extract a single frame as a JPEG thumbnail. */
export async function extractThumbnail(
  input: string,
  atSec: number,
  outPath: string,
): Promise<void> {
  const { code, stderr } = await run(FFMPEG, [
    "-y",
    "-ss",
    String(Math.max(0, atSec)),
    "-i",
    input,
    "-frames:v",
    "1",
    "-q:v",
    "3",
    outPath,
  ]);
  if (code !== 0) throw new Error(`thumbnail extraction failed: ${stderr}`);
}

/**
 * Detect scene-change boundaries. We ask FFmpeg's `select` filter for frames
 * whose scene score exceeds a threshold and parse the `pts_time` values that
 * `showinfo` prints to stderr. Failures degrade to a single whole-video scene.
 */
export async function detectScenes(
  input: string,
  durationSec: number,
  threshold = 0.3,
): Promise<Scene[]> {
  const { stderr } = await run(FFMPEG, [
    "-i",
    input,
    "-vf",
    `select='gt(scene,${threshold})',showinfo`,
    "-an",
    "-f",
    "null",
    "-",
  ]);
  const times: number[] = [];
  const re = /pts_time:([0-9.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stderr)) !== null) {
    times.push(Number(m[1]));
  }
  const cuts = [0, ...times.filter((t) => t > 0.05 && t < durationSec), durationSec];
  const uniq = Array.from(new Set(cuts)).sort((a, b) => a - b);
  const scenes: Scene[] = [];
  for (let i = 0; i + 1 < uniq.length; i++) {
    scenes.push({ index: i, start: uniq[i], end: uniq[i + 1], score: threshold });
  }
  if (scenes.length === 0) {
    scenes.push({ index: 0, start: 0, end: durationSec, score: 0 });
  }
  return scenes;
}

/**
 * Analyse loudness over time and detect silences.
 *
 * Loudness is measured with `astats` over fixed windows (grouped by
 * `asetnsamples`), whose per-window RMS level is printed via `ametadata`. This
 * is portable across FFmpeg builds (unlike `ebur128`'s per-frame readout).
 * Silences come from `silencedetect` in the same pass. Loudness drives the
 * "audio intensity" signal; silences drive silence-trimming.
 */
export async function analyzeAudio(
  input: string,
  durationSec: number,
  windowSec = 3,
): Promise<AudioAnalysis> {
  const sampleRate = 16000;
  const samplesPerWindow = sampleRate * windowSec;
  const { stdout, stderr } = await run(FFMPEG, [
    "-hide_banner",
    "-i",
    input,
    "-af",
    `aformat=sample_rates=${sampleRate}:channel_layouts=mono,` +
      `asetnsamples=n=${samplesPerWindow}:p=0,` +
      `astats=metadata=1:reset=1,ametadata=print:file=-,` +
      `silencedetect=n=-30dB:d=0.4`,
    "-f",
    "null",
    "-",
  ]);

  // Per-window RMS levels from ametadata (printed to stdout).
  const samples: { t: number; rms: number }[] = [];
  const lines = stdout.split(/\r?\n/);
  let curT = 0;
  for (const line of lines) {
    const tMatch = /pts_time:([0-9.]+)/.exec(line);
    if (tMatch) curT = Number(tMatch[1]);
    const rmsMatch = /lavfi\.astats\.Overall\.RMS_level=(-?[0-9.]+|-?inf)/.exec(line);
    if (rmsMatch) {
      const rms = rmsMatch[1].includes("inf") ? -90 : Number(rmsMatch[1]);
      samples.push({ t: curT, rms });
    }
  }

  const rmsValues = samples.map((s) => s.rms);
  const meanVolumeDb =
    rmsValues.length > 0 ? rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length : -90;
  const maxVolumeDb = rmsValues.length > 0 ? Math.max(...rmsValues) : -90;

  const lo = rmsValues.length ? Math.min(...rmsValues) : -90;
  const hi = rmsValues.length ? Math.max(...rmsValues) : -90;
  const span = hi - lo || 1;
  const windows = samples.map((s) => ({
    start: s.t,
    end: Math.min(durationSec, s.t + windowSec),
    intensity: Math.max(0, Math.min(1, (s.rms - lo) / span)),
  }));

  // Silences: pairs of silence_start / silence_end (logged to stderr).
  const silences: { start: number; end: number }[] = [];
  const reStart = /silence_start:\s*([0-9.]+)/g;
  const reEnd = /silence_end:\s*([0-9.]+)/g;
  const starts: number[] = [];
  const ends: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = reStart.exec(stderr)) !== null) starts.push(Number(m[1]));
  while ((m = reEnd.exec(stderr)) !== null) ends.push(Number(m[1]));
  for (let i = 0; i < starts.length; i++) {
    silences.push({ start: starts[i], end: ends[i] ?? durationSec });
  }

  return { meanVolumeDb, maxVolumeDb, windows, silences };
}

/**
 * Approximate visual "motion" over time using `scdet`'s mean-absolute-frame-
 * difference (mafd) metadata. This is a cheap proxy for visual interest.
 * Degrades gracefully to an empty analysis if parsing yields nothing.
 */
export async function analyzeVisual(
  input: string,
  durationSec: number,
  windowSec = 3,
): Promise<VisualAnalysis> {
  const { stderr } = await run(FFMPEG, [
    "-i",
    input,
    "-vf",
    "scdet=s=1,metadata=mode=print:file=-",
    "-an",
    "-f",
    "null",
    "-",
  ]);

  // metadata=print emits "frame:N pts_time:T" then "lavfi.scd.mafd=X" lines.
  const samples: { t: number; mafd: number }[] = [];
  const lines = stderr.split(/\r?\n/);
  let curT: number | null = null;
  for (const line of lines) {
    const tMatch = /pts_time:([0-9.]+)/.exec(line);
    if (tMatch) curT = Number(tMatch[1]);
    const mafdMatch = /lavfi\.scd\.mafd=([0-9.]+)/.exec(line);
    if (mafdMatch && curT !== null) {
      samples.push({ t: curT, mafd: Number(mafdMatch[1]) });
    }
  }

  const windowCount = Math.max(1, Math.ceil(durationSec / windowSec));
  const buckets: number[][] = Array.from({ length: windowCount }, () => []);
  for (const s of samples) {
    const idx = Math.min(windowCount - 1, Math.floor(s.t / windowSec));
    buckets[idx].push(s.mafd);
  }
  const means = buckets.map((b) => (b.length ? b.reduce((a, c) => a + c, 0) / b.length : 0));
  const hi = Math.max(1e-6, ...means);
  const windows = means.map((val, i) => ({
    start: i * windowSec,
    end: Math.min(durationSec, (i + 1) * windowSec),
    motion: Math.max(0, Math.min(1, val / hi)),
  }));
  return { windows };
}

export const ASPECT_DIMENSIONS: Record<AspectRatio, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
  "16:9": { w: 1920, h: 1080 },
};

export interface RenderOptions {
  input: string;
  output: string;
  start: number;
  end: number;
  aspectRatio: AspectRatio;
  hasAudio: boolean;
  /** Optional path to an ASS subtitle file whose captions are burned in. */
  assPath?: string;
  /** Horizontal reframe center in 0..1 (0.5 = center). Used for face tracking. */
  focusX?: number;
}

/**
 * Render a single clip: trim, auto-reframe to the target aspect ratio (scale to
 * cover, then crop toward the focus point), optionally burn captions, and
 * encode to a web-friendly MP4.
 */
export async function renderClip(opts: RenderOptions): Promise<void> {
  const dims = ASPECT_DIMENSIONS[opts.aspectRatio];
  const duration = Math.max(0.1, opts.end - opts.start);
  const focus = Math.max(0, Math.min(1, opts.focusX ?? 0.5));

  // Scale to cover the target box, then crop. The crop x is nudged toward the
  // focus point so a tracked speaker stays in frame.
  const filters = [
    `scale=${dims.w}:${dims.h}:force_original_aspect_ratio=increase`,
    `crop=${dims.w}:${dims.h}:(iw-${dims.w})*${focus.toFixed(3)}:(ih-${dims.h})/2`,
    "setsar=1",
  ];
  if (opts.assPath) {
    // Escape characters that are special inside a filtergraph.
    const escaped = opts.assPath.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
    filters.push(`ass='${escaped}'`);
  }

  const args = [
    "-y",
    "-ss",
    String(Math.max(0, opts.start)),
    "-i",
    opts.input,
    "-t",
    String(duration),
    "-vf",
    filters.join(","),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
  ];
  if (opts.hasAudio) {
    args.push("-c:a", "aac", "-b:a", "128k");
  } else {
    args.push("-an");
  }
  args.push(opts.output);

  const { code, stderr } = await run(FFMPEG, args);
  if (code !== 0) throw new Error(`render failed: ${stderr.slice(-2000)}`);
}

/** Generate a short synthetic test video (used by the demo and tests). */
export async function generateSampleVideo(
  output: string,
  durationSec: number,
): Promise<void> {
  const { code, stderr } = await run(FFMPEG, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `testsrc=size=1280x720:rate=30:duration=${durationSec}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=220:duration=${durationSec}`,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    output,
  ]);
  if (code !== 0) throw new Error(`sample generation failed: ${stderr}`);
}
