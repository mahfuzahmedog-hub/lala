import type { Caption, CaptionPreset, TranscriptWord } from "../types";

export interface CaptionOptions {
  maxWordsPerCue: number;
  maxCueSec: number;
  pauseBreakSec: number;
}

export const DEFAULT_CAPTION_OPTIONS: CaptionOptions = {
  maxWordsPerCue: 5,
  maxCueSec: 2.5,
  pauseBreakSec: 0.6,
};

/**
 * Group word-level timestamps into short, readable caption cues. We start a new
 * cue when we hit the word cap, exceed the time cap, or a natural pause occurs.
 */
export function buildCaptions(
  words: TranscriptWord[],
  opts: CaptionOptions = DEFAULT_CAPTION_OPTIONS,
): Caption[] {
  const cues: Caption[] = [];
  let current: TranscriptWord[] = [];

  const flush = () => {
    if (current.length === 0) return;
    cues.push({
      start: current[0].start,
      end: current[current.length - 1].end,
      text: current.map((w) => w.word).join(" ").replace(/\s+([,.!?;:])/g, "$1"),
      words: current,
    });
    current = [];
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    current.push(w);
    const next = words[i + 1];
    const cueDuration = w.end - current[0].start;
    const pause = next ? next.start - w.end : Infinity;
    if (
      current.length >= opts.maxWordsPerCue ||
      cueDuration >= opts.maxCueSec ||
      pause >= opts.pauseBreakSec
    ) {
      flush();
    }
  }
  flush();
  return cues;
}

/** Convert #RRGGBB to ASS &HAABBGGRR (alpha 00 = fully opaque). */
function toAssColor(hex: string, alpha = "00"): string {
  const clean = hex.replace("#", "");
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `&H${alpha}${b}${g}${r}`.toUpperCase();
}

function fmtAssTime(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const secs = (s % 60).toFixed(2).padStart(5, "0");
  return `${h}:${String(m).padStart(2, "0")}:${secs}`;
}

const alignmentFor = (pos: CaptionPreset["position"]): number =>
  pos === "top" ? 8 : pos === "center" ? 5 : 2;

/**
 * Render caption cues to an ASS subtitle document. We use ASS karaoke fills
 * (`\kf`) so each word lights up in the highlight colour as it is spoken, and a
 * short fade for a tasteful pop-in. Times are shifted so the clip starts at 0.
 */
export function captionsToAss(
  cues: Caption[],
  preset: CaptionPreset,
  dims: { w: number; h: number },
  clipStart: number,
): string {
  const primary = toAssColor(preset.highlightColor); // colour after karaoke fill
  const secondary = toAssColor(preset.primaryColor); // colour before fill
  const marginV = Math.round(dims.h * (preset.position === "center" ? 0 : 0.12));

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${dims.w}`,
    `PlayResY: ${dims.h}`,
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,${preset.fontName},${preset.fontSize},${primary},${secondary},&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,4,2,${alignmentFor(
      preset.position,
    )},80,80,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events = cues.map((cue) => {
    const start = fmtAssTime(cue.start - clipStart);
    const end = fmtAssTime(cue.end - clipStart);
    const fade = preset.animate ? "{\\fad(80,60)}" : "";
    const karaoke = cue.words
      .map((w) => {
        const cs = Math.max(1, Math.round((w.end - w.start) * 100));
        const text = preset.uppercase ? w.word.toUpperCase() : w.word;
        return `{\\kf${cs}}${text} `;
      })
      .join("")
      .trim();
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${fade}${karaoke}`;
  });

  return [...header, ...events].join("\n");
}
